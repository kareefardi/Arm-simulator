	.word 0x000007FE
	.word 0x10
	.word 0
	.word 0
_main:
	mov	r0, #10
	bl	sum		@ change this
	@ write some code here
	swi	1		@ print the integer in r0
done:
	.hword 0xDEAD

sum:
	push	{r7, lr}
	sub	sp, #12
	add	r7, sp, #0
	mov	r3, r7
	str	r0, [r3]
	mov	r2, r7
	add	r2, #8
	mov	r3, #0
	str	r3, [r2]
	add	r2, r7, #4
	mov	r3, #0
	str	r3, [r2]
.L3:
	mov	r0, r7
	add	r0, #8
	mov	r3, r7
	add	r3, #8
	add	r2, r7, #4
	ldr	r1, [r3]
	ldr	r3, [r2]
	add	r3, r1, r3
	str	r3, [r0]
	add	r2, r7, #4
	add	r3, r7, #4
	ldr	r3, [r3]
	add	r3, #1
	str	r3, [r2]
.L2:
	add	r3, r7, #4
	mov	r2, r7
	ldr	r1, [r3]
	ldr	r3, [r2]
	cmp	r1, r3
	mov	r3, r7
	add	r3, #8
	ldr	r3, [r3]
	mov	r0, r3
	mov	sp, r7
	add	sp, #12
	@ sp needed for prologue
	pop	{r7, pc}
	
