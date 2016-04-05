var mem = new Uint16Array(1024);
var regs = new Int32(16);
var fmt, op, offset5, rd, rs, offset3, rn;


function simulate(instr) {
    "use strict"; // results in a error if undeclared variables are used
    
    switch(fmt){
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
			if((instr >> 11 & 0b10) == 0b10) addOffsetStackPointer(instr); // format 13
            break;

        case 0b110: // format 16 & 17
			if((instr>>8 & 0b11111) == 0b11111) softwareInterrupt(instr); // format 17
			else conditionalBranch(instr); // format 16
            break;

        case 0b111: // format 18 & 19
			if( ((instr >> 11)&(0b00)) == 0)	unconditionalBranch(instr); // format 18
			else londBranchWithLink(instr);//format 19
            break;
		case 0xdead: // terminate program
			exit(EXIT_SUCCESS);
            break;
        default:
            break;
    }
}

//
function addSubtract(instr){
    
}
function moveShiftedRegister(instr){
    
}
function arithmeticImediate(instr){
    
}
function alu(instr){
    
}
function pcRelativeLoad(instr){
    
}
function loadStoreRegisterOffset(instr){
    
}
function loadStoreWithImmOffset(instr){
    
}
function addOffsetStackPointer(instr){
    
}
function unconditionalBranch(instr){
    
}
function londBranchWithLink(instr){
    
}
function conditionalBranch(instr){
    
}
