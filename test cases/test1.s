	.word 0x000007FE
	.word 0x10
	.word 0
	.word 0
_main:
	mov	r4, #10
	mov	r5, #20
	add	r4, r4, r5
	sub	r4, #30
	mov	r0, r4	
	swi	1		@ print the integer in r0
done:
	.hword 0xDEAD
