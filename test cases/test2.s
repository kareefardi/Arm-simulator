	.word 0x000007FE
	.word 0x10
	.word 0
	.word 0
_main:
	mov r0,#0x12
	lsl r0,r0,#8
	mov r1,#0x34
	orr r0,r1
	lsl r0,r0,#8
	mov r1,#0x56
	orr r0,r1
	lsl r0,r0,#8
	mov r1,#0x78
	orr r0,r1
	swi	1		@ print the integer in r0
done:
	.hword 0xDEAD
