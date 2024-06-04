// Copyright (c) Vitaliy Filippov, 2019+
// License: VNPL-1.1 (see README.md for details)

const { RuleCombinator } = require('./lp_optimizer/dsl_pgs.js');
const { SimpleCombinator, flatten_tree } = require('./lp_optimizer/simple_pgs.js');
const { validate_pool_cfg, get_pg_rules } = require('./pool_config.js');
const LPOptimizer = require('./lp_optimizer/lp_optimizer.js');
const { scale_pg_count } = require('./pg_utils.js');
const { make_hier_tree, filter_osds_by_root_node,
    filter_osds_by_tags, filter_osds_by_block_layout, get_affinity_osds } = require('./osd_tree.js');

let seed;

function reset_rng()
{
    seed = 0x5f020e43;
}

function rng()
{
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return seed + 2147483648;
}

function pick_primary(pool_config, osd_set, up_osds, aff_osds)
{
    let alive_set;
    if (pool_config.scheme === 'replicated')
    {
        // Prefer "affinity" OSDs
        alive_set = osd_set.filter(osd_num => osd_num && aff_osds[osd_num]);
        if (!alive_set.length)
            alive_set = osd_set.filter(osd_num => osd_num && up_osds[osd_num]);
    }
    else
    {
        // Prefer data OSDs for EC because they can actually read something without an additional network hop
        const pg_data_size = (pool_config.pg_size||0) - (pool_config.parity_chunks||0);
        alive_set = osd_set.slice(0, pg_data_size).filter(osd_num => osd_num && aff_osds[osd_num]);
        if (!alive_set.length)
            alive_set = osd_set.filter(osd_num => osd_num && aff_osds[osd_num]);
        if (!alive_set.length)
        {
            alive_set = osd_set.slice(0, pg_data_size).filter(osd_num => osd_num && up_osds[osd_num]);
            if (!alive_set.length)
                alive_set = osd_set.filter(osd_num => osd_num && up_osds[osd_num]);
        }
    }
    if (!alive_set.length)
    {
        return 0;
    }
    return alive_set[rng() % alive_set.length];
}

function recheck_primary(state, global_config, up_osds, osd_tree)
{
    let new_config_pgs;
    for (const pool_id in state.config.pools)
    {
        const pool_cfg = state.config.pools[pool_id];
        if (!validate_pool_cfg(pool_id, pool_cfg, global_config.placement_levels, false))
        {
            continue;
        }
        const aff_osds = get_affinity_osds(pool_cfg, up_osds, osd_tree);
        reset_rng();
        for (let pg_num = 1; pg_num <= pool_cfg.pg_count; pg_num++)
        {
            if (!state.config.pgs.items[pool_id])
            {
                continue;
            }
            const pg_cfg = state.config.pgs.items[pool_id][pg_num];
            if (pg_cfg)
            {
                const new_primary = pick_primary(state.config.pools[pool_id], pg_cfg.osd_set, up_osds, aff_osds);
                if (pg_cfg.primary != new_primary)
                {
                    if (!new_config_pgs)
                    {
                        new_config_pgs = JSON.parse(JSON.stringify(state.config.pgs));
                    }
                    console.log(
                        `Moving pool ${pool_id} (${pool_cfg.name || 'unnamed'}) PG ${pg_num}`+
                        ` primary OSD from ${pg_cfg.primary} to ${new_primary}`
                    );
                    new_config_pgs.items[pool_id][pg_num].primary = new_primary;
                }
            }
        }
    }
    return new_config_pgs;
}

function save_new_pgs_txn(save_to, request, state, etcd_prefix, etcd_watch_revision, pool_id, up_osds, osd_tree, prev_pgs, new_pgs, pg_history)
{
    const aff_osds = get_affinity_osds(state.config.pools[pool_id] || {}, up_osds, osd_tree);
    const pg_items = {};
    reset_rng();
    new_pgs.map((osd_set, i) =>
    {
        osd_set = osd_set.map(osd_num => osd_num === LPOptimizer.NO_OSD ? 0 : osd_num);
        pg_items[i+1] = {
            osd_set,
            primary: pick_primary(state.config.pools[pool_id], osd_set, up_osds, aff_osds),
        };
        if (prev_pgs[i] && prev_pgs[i].join(' ') != osd_set.join(' ') &&
            prev_pgs[i].filter(osd_num => osd_num).length > 0)
        {
            pg_history[i] = pg_history[i] || {};
            pg_history[i].osd_sets = pg_history[i].osd_sets || [];
            pg_history[i].osd_sets.push(prev_pgs[i]);
        }
        if (pg_history[i] && pg_history[i].osd_sets)
        {
            pg_history[i].osd_sets = Object.values(pg_history[i].osd_sets
                .reduce((a, c) => { a[c.join(' ')] = c; return a; }, {}));
        }
    });
    for (let i = 0; i < new_pgs.length || i < prev_pgs.length; i++)
    {
        // FIXME: etcd has max_txn_ops limit, and it's 128 by default
        // Sooo we probably want to change our storage scheme for PG histories...
        request.compare.push({
            key: b64(etcd_prefix+'/pg/history/'+pool_id+'/'+(i+1)),
            target: 'MOD',
            mod_revision: ''+etcd_watch_revision,
            result: 'LESS',
        });
        if (pg_history[i])
        {
            request.success.push({
                requestPut: {
                    key: b64(etcd_prefix+'/pg/history/'+pool_id+'/'+(i+1)),
                    value: b64(JSON.stringify(pg_history[i])),
                },
            });
        }
        else
        {
            request.success.push({
                requestDeleteRange: {
                    key: b64(etcd_prefix+'/pg/history/'+pool_id+'/'+(i+1)),
                },
            });
        }
    }
    save_to.items = save_to.items || {};
    if (!new_pgs.length)
    {
        delete save_to.items[pool_id];
    }
    else
    {
        save_to.items[pool_id] = pg_items;
    }
}

async function generate_pool_pgs(state, global_config, pool_id, osd_tree, levels)
{
    const pool_cfg = state.config.pools[pool_id];
    if (!validate_pool_cfg(pool_id, pool_cfg, global_config.placement_levels, false))
    {
        return null;
    }
    let pool_tree = { ...osd_tree };
    filter_osds_by_root_node(global_config, pool_tree, pool_cfg.root_node);
    filter_osds_by_tags(pool_tree, pool_cfg.osd_tags);
    filter_osds_by_block_layout(
        pool_tree,
        state.osd.stats,
        pool_cfg.block_size || global_config.block_size || 131072,
        pool_cfg.bitmap_granularity || global_config.bitmap_granularity || 4096,
        pool_cfg.immediate_commit || global_config.immediate_commit || 'none'
    );
    pool_tree = make_hier_tree(global_config, pool_tree);
    // First try last_clean_pgs to minimize data movement
    let prev_pgs = [];
    for (const pg in ((state.history.last_clean_pgs.items||{})[pool_id]||{}))
    {
        prev_pgs[pg-1] = [ ...state.history.last_clean_pgs.items[pool_id][pg].osd_set ];
    }
    if (!prev_pgs.length)
    {
        // Fall back to config/pgs if it's empty
        for (const pg in ((state.config.pgs.items||{})[pool_id]||{}))
        {
            prev_pgs[pg-1] = [ ...state.config.pgs.items[pool_id][pg].osd_set ];
        }
    }
    const old_pg_count = prev_pgs.length;
    const optimize_cfg = {
        osd_weights: Object.values(pool_tree).filter(item => item.level === 'osd').reduce((a, c) => { a[c.id] = c.size; return a; }, {}),
        combinator: !global_config.use_old_pg_combinator || pool_cfg.level_placement || pool_cfg.raw_placement
            // new algorithm:
            ? new RuleCombinator(pool_tree, get_pg_rules(pool_id, pool_cfg, global_config.placement_levels), pool_cfg.max_osd_combinations)
            // old algorithm:
            : new SimpleCombinator(flatten_tree(pool_tree[''].children, levels, pool_cfg.failure_domain, 'osd'), pool_cfg.pg_size, pool_cfg.max_osd_combinations),
        pg_count: pool_cfg.pg_count,
        pg_size: pool_cfg.pg_size,
        pg_minsize: pool_cfg.pg_minsize,
        ordered: pool_cfg.scheme != 'replicated',
    };
    let optimize_result;
    // Re-shuffle PGs if config/pgs.hash is empty
    if (old_pg_count > 0 && state.config.pgs.hash)
    {
        if (prev_pgs.length != pool_cfg.pg_count)
        {
            // Scale PG count
            // Do it even if old_pg_count is already equal to pool_cfg.pg_count,
            // because last_clean_pgs may still contain the old number of PGs
            scale_pg_count(prev_pgs, pool_cfg.pg_count);
        }
        for (const pg of prev_pgs)
        {
            while (pg.length < pool_cfg.pg_size)
            {
                pg.push(0);
            }
        }
        optimize_result = await LPOptimizer.optimize_change({
            prev_pgs,
            ...optimize_cfg,
        });
    }
    else
    {
        optimize_result = await LPOptimizer.optimize_initial(optimize_cfg);
    }
    console.log(`Pool ${pool_id} (${pool_cfg.name || 'unnamed'}):`);
    LPOptimizer.print_change_stats(optimize_result);
    let pg_effsize = pool_cfg.pg_size;
    for (const pg of optimize_result.int_pgs)
    {
        const this_pg_size = pg.filter(osd => osd != LPOptimizer.NO_OSD).length;
        if (this_pg_size && this_pg_size < pg_effsize)
        {
            pg_effsize = this_pg_size;
        }
    }
    return {
        pool_id,
        pgs: optimize_result.int_pgs,
        stats: {
            total_raw_tb: optimize_result.space,
            pg_real_size: pg_effsize || pool_cfg.pg_size,
            raw_to_usable: (pg_effsize || pool_cfg.pg_size) / (pool_cfg.scheme === 'replicated'
                ? 1 : (pool_cfg.pg_size - (pool_cfg.parity_chunks||0))),
            space_efficiency: optimize_result.space/(optimize_result.total_space||1),
        },
    };
}

function b64(str)
{
    return Buffer.from(str).toString('base64');
}

module.exports = {
    recheck_primary,
    save_new_pgs_txn,
    generate_pool_pgs,
};
