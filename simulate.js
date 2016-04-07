var mem = new Uint8Array(1024);
var regs = new Int32Array(16);

regs[15] = 2; // set program counter 2 since its always 2 instructions ahaed of what we execture
var codeSegment; // 16 bit unsigned array, containing instructions to execute
var zeroFlag = 0,negativeFlag = 0,carryFlag = 0, overflow = 0;
// conditons flags for implemented formats 1-4 not implemented

function start(){

}

function stop(){

}
// executes of statement
function step(){
    if(regs-2 < codeSegment.length){
        simulate(codeSegment[pc-2]);
        regs[15] += 1; // increment by one
    }else{ // disable buttons of step and start since execution finished

    }
}


function simulate(instr) {
    "use strict";
    var fmt = intr>>13; // discard all but last 3 bits used for format identification

    switch(fmt){
        case 0b000: // for format zero check whether to add/subtract or shift register
			(instr >> 11 & 3) == 3 ? addSubtract(instr) : moveShiftedRegister(instr);
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
			terminateProgram(0); // zero for exit_success
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
         if(immediateFlag == 1){
            regs[destinationReg] =  regs[sourceReg] + offsetNReg;
         }else{
          regs[destinationReg] = regs[sourceReg] + regs[offsetNReg];
        }
    }else{ // subtract
         if(immediateFlag == 1){
            regs[destinationReg] = regs[sourceReg] - offsetNReg;
        }else{
            regs[destinationReg] = regs[sourceReg] - regs[offsetNReg];
        }
    }
}


// format 1
function moveShiftedRegister(instr){
    "use strict";
    var offset = instr>>6 & 0b11111; // extract offset
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = intr>>11 & 0b11;
    var stringInstr; // string representation of instruction
    switch(opcode){
        case 0:
            regs[destinationReg] = regs[sourceReg]<<offset; // left arthmetic shift
            stringInstr = concatArgs('MOVS','R',destinationReg
                                     ,',','R',sourceReg,',','LSL#',offset);
            break;
        case 1:
            regs[destinationReg] = regs[sourceReg]>>>offset; // right logical shift

            stringInstr = concatArgs('MOVS','R',destinationReg
                                     ,',','R',sourceReg,',','LSR#',offset);
            break;
        case 2:
            regs[destinationReg] = regs[sourceReg]>>offset; // right arithmetic shift
            stringInstr = concatArgs('MOVS','R',destinationReg
                                     ,',','R',sourceReg,',','ASR#',offset);
            break;
        default:
            console.log('move shifted register unknown operation');
            stringInstr = 'unknown instruction';
            break;
    }
    printInstruction(stringInstr);
}
// format 3,  condition codes not written
function arithmeticImediate(instr){
    "use strict";
    var offset8 = instr&0b1111111;
    var destinationReg = instr>>8 & 0b111;
    var opCode = instr>>11 & 0b11;
    var stringInstr;
    switch(opCode){
        case 0:
            regs[destinationReg] = offset8;
            stringInstr = concatArgs('MOVS ','R',
                                     destinationReg,',#',offset);
            break;
        case 1:
            if(regs[destinationReg] == offset8)
                zeroFlag = 1;
            else
                zeroFlag = 0;
            if(regs[destinationReg]-offset8 < 0)
                negativeFlag = 1;
            else
                negativeFlag = 0;
         //   carryFlag = overflow = 0;
            // implement comparison
            stringInstr = concatArgs('CMP ','R',
                                     destinationReg,',#',offset);
            break;
        case 2:
            regs[destinationReg] = regs[destinationReg] + offset8;
            stringInstr = concatArgs('ADDS ','R',
                    destinationReg,',R',destinationReg,',#',offset);
            break;
        case 3:
            regs[destinationReg] = regs[destinationReg] - offset8;
            stringInstr = concatArgs('SUBS ','R',
                    destinationReg,',R',destinationReg,',#',offset);
            break;
    }
    printInstruction(stringInstr);
}
//format 4
function alu(instr){
    "use strict";
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = instr>>6 & 0b1111;
    var stringInstr;
    switch(instr){
        case 0: // overflow detection not implemented
            regs[destinationReg] += regs[sourceReg];
            stringInstr = 'AND R'+destinationReg+',R'+sourceReg;
            break;
        case 1:
            regs[destinationReg] ^= regs[sourceReg];
            stringInstr = 'EOR R'+destinationReg+',R'+sourceReg;
            break;
        case 2:
            regs[destinationReg] = regs[destinationReg]<<regs[sourceReg];
            stringInstr = 'LSL R'+destinationReg+',R'+sourceReg;
            break;
        case 3:
            regs[destinationReg] = regs[destinationReg]>>regs[sourceReg];
            stringInstr = 'LSR R'+destinationReg+',R'+sourceReg;
            break;
        case 4:
            regs[destinationReg] = regs[destinationReg]>>>regs[sourceReg];
            stringInstr = 'ASR R'+destinationReg+',R'+sourceReg;
           break;
        case 5:
            regs[destinationReg] += regs[destinationReg]+carryFlag;
            stringInstr = 'ADC R'+destinationReg+',R'+sourceReg;
            break;
        case 6:
            regs[destinationReg] -= regs[sourceReg];
            regs[destinationReg] -= (~carryFlag)&1; // and with one since carry flag should be 1 bit amd carryhere is i
            stringInstr = 'SBCs';
            break;
        case 7:// rotate right
            var tmp = regs[destinationReg]>>regs[sourceReg];
            regs[destinationReg] = regs[destinationReg]<<(32-regs[sourceReg]);
            regs[destinationReg] |= tmp;
            stringInstr = 'ROR R'+destinationReg+',R'+sourceReg;
            break;
        case 8:// TST
            /* carryflag calculation not clear yet, overflow flag not affected by TST instruction
            var result = regs[destinationReg]&regs[sourceReg];
            zeroFlag = result ? 1 : 0;
            negativeFlag = result < 0 ? 1 : 0;
            stringInstr = 'TSR';
            */
            break;
        case 9:
            regs[destinationReg] = -regs[sourceReg];
            stringInstr = 'NEG R'+destinationReg+',R'+sourceReg;
            break;
        case 10:
            break;
        case 11:
            break;
        case 12:
            regs[destinationReg] |= regs[sourceReg];
            stringInstr = 'ORR R'+destinationReg+',R'+sourceReg;
            break;
        case 13:
            regs[destinationReg] *= regs[sourceReg];
            stringInstr = 'MUL R'+destinationReg+',R'+sourceReg;
            break;
        case 14:
            regs[destinationReg] = regs[destinationReg] & (~regs[sourceReg]);
            stringInstr = 'BIC R'+destinationReg+',R'+sourceReg;
            break;
        default: // opcode 1111
            regs[destinationReg] = ~regs[sourceReg];
            stringInstr = 'MVN R'+destinationReg+',R'+sourceReg;
            break;
    }
    printInstruction(stringInstr);
}
// format 6
function pcRelativeLoad(instr){

}
function loadStoreRegisterOffset(instr){

}
function loadStoreWithImmOffset(instr){

}
function addOffsetStackPointer(instr){

}
function unconditionalBranch(instr){
    var offsetvalue= instr >> 10 & 0b1111111111;    //extract offset value
        offsetvalue=offsetvalue-2;  //to account for pc increment
}
function londBranchWithLink(instr){

}
function conditionalBranch(instr){

}
// concatinates all strings and integers into a string
function concatArgs(){
    var str;
    for (var i = 0; i < arguments.length; i++) {
        str = str + arguments[i];
    }
    return str;
}

function terminateProgram(status){

}
