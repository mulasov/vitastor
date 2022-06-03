[Documentation](../../README.md#documentation) → Installation → Packages

-----

[Читать на русском](packages.ru.md)

# Packages

## Debian

- Trust Vitastor package signing key:
  `wget -q -O - https://vitastor.io/debian/pubkey | sudo apt-key add -`
- Add Vitastor package repository to your /etc/apt/sources.list:
  - Debian 11 (Bullseye/Sid): `deb https://vitastor.io/debian bullseye main`
  - Debian 10 (Buster): `deb https://vitastor.io/debian buster main`
- For Debian 10 (Buster) also enable backports repository:
  `deb http://deb.debian.org/debian buster-backports main`
- Install packages: `apt update; apt install vitastor lp-solve etcd linux-image-amd64 qemu`

## CentOS

- Add Vitastor package repository:
  - CentOS 7: `yum install https://vitastor.io/rpms/centos/7/vitastor-release-1.0-1.el7.noarch.rpm`
  - CentOS 8: `dnf install https://vitastor.io/rpms/centos/8/vitastor-release-1.0-1.el8.noarch.rpm`
- Enable EPEL: `yum/dnf install epel-release`
- Enable additional CentOS repositories:
  - CentOS 7: `yum install centos-release-scl`
  - CentOS 8: `dnf install centos-release-advanced-virtualization`
- Enable elrepo-kernel:
  - CentOS 7: `yum install https://www.elrepo.org/elrepo-release-7.el7.elrepo.noarch.rpm`
  - CentOS 8: `dnf install https://www.elrepo.org/elrepo-release-8.el8.elrepo.noarch.rpm`
- Install packages: `yum/dnf install vitastor lpsolve etcd kernel-ml qemu-kvm`

## Installation requirements

- Linux kernel 5.4 or newer, for io_uring support. 5.8 or later is highly
  recommended because io_uring is a relatively new technology and there is
  at least one bug which reproduces with io_uring and HP SmartArray
  controllers in 5.4
- liburing 0.4 or newer
- lp_solve
- etcd 3.4.15 or newer. Earlier versions won't work because of various bugs,
  for example [#12402](https://github.com/etcd-io/etcd/pull/12402).
- node.js 10 or newer