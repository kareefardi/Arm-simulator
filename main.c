#include "stdio.h"
#include "stdlib.h"

int simulate(unsigned short);

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
        case 0b000:
        break;

        case 0b001:
        break;

        case 0b010:
        break;

        case 0b011:
        break;

        case 0b101:
        break;

        case 0b110:
        break;

        case 0b111:
        break;
    }

}
