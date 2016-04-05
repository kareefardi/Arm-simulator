var mem = new Uint16Array(1024);
var regs = new Int32(16);
var zeroFlag = 0,negativeFlag = 0,carryFlag = 0, overflow = 0;

function simulate(instr) {
    "use strict";
    var fmt = intr>>13; // discard all but last 3 bits used for format identification
    
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

//format 2
function addSubtract(instr){
    "use strict";
    var offsetNReg = instr>>6 & 0b11111; // register id or immediate value depending
    var destinationReg = instr & 0b111;     // on op immediate flag 
    var sourceReg = instr>>3 & 0b111;
    var immediateFlag = instr>>10 & 0b1;
    var opCode = instr>>9 & 0b1;
    
    if(opCode == 0){ // add
        regs[destinationReg] immediateFlag == 1 ? 
            regs[sourceReg] + offsetNValue : regs[sourceReg] + regs[offsetNReg];
    }else{ // subtract
        regs[destinationReg] immediateFlag == 1 ? 
            regs[sourceReg] - offsetNValue : regs[sourceReg] - regs[offsetNReg];
    }
}

// prints output to web ui
function printInstruction(instrString){
    
}

function 

// format 1
function moveShiftedRegister(instr){
    "use strict";
    var offset = instr>>6 & 0b11111; // extract offset
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = intr>>11 & 0b11;
    
    switch(opcode){
        case 0:
            regs[destinationReg] = reg[sourceReg]<<offset; // left arthmetic shift
            break;
        case 1:
            regs[destinationReg] = reg[sourceReg]>>>offset; // right logical shift
            break;
        case 2;
            regs[destinationReg] = reg[sourceReg]>>offset; // right arithmetic shift
            break;
        default:
            console.log('move shifted register unknown operation');
    }
    
}
// format 3, comparision condition not written
function arithmeticImediate(instr){
    "use strict";
    var offset8 = instr&0b1111111;
    var destinationReg = instr>>8 & 0b111;
    var opCode = instr>>11 & 0b11;
    
    switch(opCode){
        case 0:
            reg[destinationReg] = offset8;
            break;
        case 1:
            
            break:
        case 2:
            reg[destinationReg] = reg[destinationReg] + offset8;
            break;
        case 3:
            reg[destinationReg] = regs[destinationReg] - offset8;
            break;
    }
}
//format 4
function alu(instr){
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = instr>>6 & 0b1111;
    
    switch(instr){
        case 0: // overflow detection not implemented
            reg[destinationReg] += reg[sourceReg];
            zeroFlag = regs[destinationReg] == 0; 
            break;
        case 1:
            break;
        case 2:
            break;
        case 3:
            break;
        case 4:
            break;
        case 5:
            break;
        case 6:
            break;
        case 7:
            break;
        case 8:
            break;
        case 9:
            break;
        case 10:
            break;
        case 11:
            break;
        case 12:
            break;
        case 13:
            break;
        case 14:
            break:
        case default:
            break;    
    }
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

function openFile(){
}
