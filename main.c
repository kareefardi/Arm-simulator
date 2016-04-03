#include "stdio.h"
#include "stdlib.h"

int simulate(unsigned short);

void addSubtract(unsigned short instr);
void moveShiftedRegister(unsigned short instr);
void arithmeticImediate(unsigned short instr);
void alu(unsigned short instr);
void pcRelativeLoad(unsigned short instr);
void loadStoreRegisterOffset(unsigned short instr);
void loadStoreWithImmOffset(unsigned short instr);

unsigned char Mem[1024];
unsigned int Regs[16];

#define	PC	Regs[15]
#define	LR	Regs[14]

int main() {
    FILE *fp;
    unsigned short inst_word;

    fp = fopen("test.s.bin","rb");

    if(NULL==fp) {
        printf("Cannot open the file\n");
        exit(0);
    }

    while(fread(&inst_word, 2,1, fp))
    {
        printf("%08x\t%04x\t", PC, inst_word);
        simulate(inst_word);
        PC += 2;
    }
    fclose(fp);
    return 0;
}


int simulate(unsigned short instr)
{
    unsigned char fmt, op, offset5, rd, rs, offset3, rn;
    fmt = (instr) >> 13;

    switch (fmt) {
        case 0b000: // for format zero check whether to add/subtract or shift register
			(instr >> 11 & 3) == 3 ? addSubtract(instr) ? moveShiftedRegister(instr);
		break;

        case 0b001: // arithmetic operations with immediate value
			arithmeticImediate(instr);
        break;

        case 0b010: // format 4 & 6 & 7
			if (isntr >> 10 & (0b010000) == (0b010000)) alu(instr); // alu operations format 4
			else if (isntr >> 11 & (0b01001) == (0b01001)) pcRelativeLoad(instr); // format 6
			else if (instr >> 12 & (0b0101) == (0b0101)) loadStoreRegisterOffset(instr); // format 7
        break;

        case 0b011: // format 9
			loadStoreWithImmOffset(instr);
        break;

        case 0b101: // format 13 &  14

        break;

        case 0b110:
        break;

        case 0b111:
        break;
    }

}
