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

    switch(fmt){
        case 0:             // format 1/2
            op = (instr >> 11) & 3;
            rd = instr & 7;
            rs = (instr >>  3) & 7;
            offset5 = (instr >> 6) & 0x1F;
            if(op!=3) {     // format 1
                /*
                switch(op){
                    case 0: printf("lsl\tr%d, r%d, #%d\n", rd, rs, offset5); break;
                    case 1: printf("lsr\tr%d, r%d, #%d\n", rd, rs, offset5); break;
                    case 2: printf("asr\tr%d, r%d, #%d\n", rd, rs, offset5); break;
                
                }*/
            } else { /*add/sub*/
                offset3 = rn = offset5 & 0x07;
                if((offset5 & 0x08) == 0){
                    printf("add\tr%d, r%d, ", rd, rs);
                	if((offset5 & 0x10) == 0){
                    	printf("r%d\n", rn);
                    	Regs[rd] = Regs[rs] + Regs[rn];
                    }
                	else {
                    	printf("#%d\n", offset3);
                    	Regs[rd] = Regs[rs] + offset3;
                    }
                }
                else {
                    printf("sub\tr%d, r%d, ", rd, rs);
                    if((offset5 & 0x10) == 0){
                    	printf("r%d\n", rn);
                    	Regs[rd] = Regs[rs] - Regs[rn];
                    }
                	else {
                    	printf("#%d\n", offset3);
                    	Regs[rd] = Regs[rs] - offset3;
                    }
				}
                
                    
                
            }
            break;
        /*    
        case 7:
            if(((instr>>11)&3) == 0) {
                int off;
                if(instr & 0x400)
                    off = (instr & 0x7FF) - 0x800;
                else
                    off = (instr & 0x7FF);
                printf("B\t%d\t\t# Jump to (current instr. addr)+4%+d\n", off,off*2);
            }
            break;
        */
        default:
            printf("UNKOWN\n");
    }

}