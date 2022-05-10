/*
 * Please do not edit this file.
 * It was generated using rpcgen.
 */

#ifndef _PORTMAP_H_RPCGEN
#define _PORTMAP_H_RPCGEN

#include "xdr_impl.h"


#ifdef __cplusplus
extern "C" {
#endif

#define PMAP_PORT 111

struct pmap2_mapping {
	u_int prog;
	u_int vers;
	u_int prot;
	u_int port;
};
typedef struct pmap2_mapping pmap2_mapping;

struct pmap2_call_args {
	u_int prog;
	u_int vers;
	u_int proc;
	xdr_string_t args;
};
typedef struct pmap2_call_args pmap2_call_args;

struct pmap2_call_result {
	u_int port;
	xdr_string_t res;
};
typedef struct pmap2_call_result pmap2_call_result;

struct pmap2_mapping_list {
	pmap2_mapping map;
	struct pmap2_mapping_list *next;
};
typedef struct pmap2_mapping_list pmap2_mapping_list;

struct pmap2_dump_result {
	struct pmap2_mapping_list *list;
};
typedef struct pmap2_dump_result pmap2_dump_result;

struct pmap3_string_result {
	xdr_string_t addr;
};
typedef struct pmap3_string_result pmap3_string_result;

struct pmap3_mapping {
	u_int prog;
	u_int vers;
	xdr_string_t netid;
	xdr_string_t addr;
	xdr_string_t owner;
};
typedef struct pmap3_mapping pmap3_mapping;

struct pmap3_mapping_list {
	pmap3_mapping map;
	struct pmap3_mapping_list *next;
};
typedef struct pmap3_mapping_list pmap3_mapping_list;

struct pmap3_dump_result {
	struct pmap3_mapping_list *list;
};
typedef struct pmap3_dump_result pmap3_dump_result;

struct pmap3_call_args {
	u_int prog;
	u_int vers;
	u_int proc;
	xdr_string_t args;
};
typedef struct pmap3_call_args pmap3_call_args;

struct pmap3_call_result {
	u_int port;
	xdr_string_t res;
};
typedef struct pmap3_call_result pmap3_call_result;

struct pmap3_netbuf {
	u_int maxlen;
	xdr_string_t buf;
};
typedef struct pmap3_netbuf pmap3_netbuf;

typedef pmap2_mapping PMAP2SETargs;

typedef pmap2_mapping PMAP2UNSETargs;

typedef pmap2_mapping PMAP2GETPORTargs;

typedef pmap2_call_args PMAP2CALLITargs;

typedef pmap2_call_result PMAP2CALLITres;

typedef pmap2_dump_result PMAP2DUMPres;

typedef pmap3_mapping PMAP3SETargs;

typedef pmap3_mapping PMAP3UNSETargs;

typedef pmap3_mapping PMAP3GETADDRargs;

typedef pmap3_string_result PMAP3GETADDRres;

typedef pmap3_dump_result PMAP3DUMPres;

typedef pmap3_call_result PMAP3CALLITargs;

typedef pmap3_call_result PMAP3CALLITres;

typedef pmap3_netbuf PMAP3UADDR2TADDRres;

typedef pmap3_netbuf PMAP3TADDR2UADDRargs;

typedef pmap3_string_result PMAP3TADDR2UADDRres;

#define PMAP_PROGRAM 100000
#define PMAP_V2 2


#define PMAP2_NULL 0
#define PMAP2_SET 1
#define PMAP2_UNSET 2
#define PMAP2_GETPORT 3
#define PMAP2_DUMP 4
#define PMAP2_CALLIT 5

#define PMAP_V3 3


#define PMAP3_NULL 0
#define PMAP3_SET 1
#define PMAP3_UNSET 2
#define PMAP3_GETADDR 3
#define PMAP3_DUMP 4
#define PMAP3_CALLIT 5
#define PMAP3_GETTIME 6
#define PMAP3_UADDR2TADDR 7
#define PMAP3_TADDR2UADDR 8


/* the xdr functions */


extern  bool_t xdr_pmap2_mapping (XDR *, pmap2_mapping*);
extern  bool_t xdr_pmap2_call_args (XDR *, pmap2_call_args*);
extern  bool_t xdr_pmap2_call_result (XDR *, pmap2_call_result*);
extern  bool_t xdr_pmap2_mapping_list (XDR *, pmap2_mapping_list*);
extern  bool_t xdr_pmap2_dump_result (XDR *, pmap2_dump_result*);
extern  bool_t xdr_pmap3_string_result (XDR *, pmap3_string_result*);
extern  bool_t xdr_pmap3_mapping (XDR *, pmap3_mapping*);
extern  bool_t xdr_pmap3_mapping_list (XDR *, pmap3_mapping_list*);
extern  bool_t xdr_pmap3_dump_result (XDR *, pmap3_dump_result*);
extern  bool_t xdr_pmap3_call_args (XDR *, pmap3_call_args*);
extern  bool_t xdr_pmap3_call_result (XDR *, pmap3_call_result*);
extern  bool_t xdr_pmap3_netbuf (XDR *, pmap3_netbuf*);
extern  bool_t xdr_PMAP2SETargs (XDR *, PMAP2SETargs*);
extern  bool_t xdr_PMAP2UNSETargs (XDR *, PMAP2UNSETargs*);
extern  bool_t xdr_PMAP2GETPORTargs (XDR *, PMAP2GETPORTargs*);
extern  bool_t xdr_PMAP2CALLITargs (XDR *, PMAP2CALLITargs*);
extern  bool_t xdr_PMAP2CALLITres (XDR *, PMAP2CALLITres*);
extern  bool_t xdr_PMAP2DUMPres (XDR *, PMAP2DUMPres*);
extern  bool_t xdr_PMAP3SETargs (XDR *, PMAP3SETargs*);
extern  bool_t xdr_PMAP3UNSETargs (XDR *, PMAP3UNSETargs*);
extern  bool_t xdr_PMAP3GETADDRargs (XDR *, PMAP3GETADDRargs*);
extern  bool_t xdr_PMAP3GETADDRres (XDR *, PMAP3GETADDRres*);
extern  bool_t xdr_PMAP3DUMPres (XDR *, PMAP3DUMPres*);
extern  bool_t xdr_PMAP3CALLITargs (XDR *, PMAP3CALLITargs*);
extern  bool_t xdr_PMAP3CALLITres (XDR *, PMAP3CALLITres*);
extern  bool_t xdr_PMAP3UADDR2TADDRres (XDR *, PMAP3UADDR2TADDRres*);
extern  bool_t xdr_PMAP3TADDR2UADDRargs (XDR *, PMAP3TADDR2UADDRargs*);
extern  bool_t xdr_PMAP3TADDR2UADDRres (XDR *, PMAP3TADDR2UADDRres*);


#ifdef __cplusplus
}
#endif

#endif /* !_PORTMAP_H_RPCGEN */