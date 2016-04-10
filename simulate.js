var STACK_POINTER = 13;// stack pointer index
var LR = 14; // link and return index
var PC = 15;
var mem = new Uint8Array(2048);
var regs = new Int32Array(16);

regs[15] = 4; // set program counter 2 since its always 2 instructions ahaed of what we execture
var zeroFlag = 0,negativeFlag = 0,carryFlag = 0, overflowFlag = 0;
// conditons flags for implemented formats 1-4 not implemented

function start(){

}

function stop(){

}
// executes of statement
function step(){
    "use strict";

    var instrLoc = regs[15]-4;
    if(instrLoc < mem.length){
        var instr = mem[instrLoc] | mem[instrLoc+1]<<8
        simulate(instr);// load upper and lower part of half word instruction
        regs[15] += 2; // increment by one
        console.log('instr decimal rep'+instr);
        printRegisterContent(regs);
    }else{ // disable buttons of step and start since execution finished
        console.log('program execution done');
    }
}

function simulate(instr) {
    "use strict";
    var fmt = instr>>13; // discard all but last 3 bits used for format identification
    switch(fmt){
        case 0b000: // for format zero check whether to add/subtract or shift register
			(instr >> 11 & 0b11) == 3 ? addSubtract(instr) : moveShiftedRegister(instr);
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

        case 0b100: // format 10 & 11
            if(instr >> 12 == (0b1000))
                loadStoreHalfword(instr);
            else
                SPloadStore(instr);

        case 0b101: // format 12 & 13 &  14
            //format 13 and 14 may have clashed since L can be 0 or 1 using previous parse
			if((instr >> 8 & 010110000) == 010110000) addOffsetStackPointer(instr); // format
            else {
                if (instr >> 12 & 1 == 1) {
                    pushPopRegisters(instr); // format 14
            }   else {
                    loadAdress(instr);
                    }
                }
            break;

        case 0b110: // format 15 & 16 & 17
			if((instr>>8 & 0b11111) == 0b11111) softwareInterrupt(instr); // format 17
			else {
                 if ((instr >> 12 & 1) == 1)
                    conditionalBranch(instr); // format 16
                 else
                    multLoadStore(instr); // format 15
            }
            break;

        case 0b111: // format 18 & 19
			if( ((instr >> 11)&(0b00)) == 0)	unconditionalBranch(instr); // format 18
			else longBranchWithLink(instr);//format 19
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
    var opcode = instr>>11 & 0b11;
    var stringInstr; // string representation of instruction
    switch(opcode){
        case 0:
            regs[destinationReg] = regs[sourceReg]<<offset; // left arthmetic shift
            stringInstr = concatArgs('LSL ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
            break;
        case 1:
            regs[destinationReg] = regs[sourceReg]>>>offset; // right logical shift

            stringInstr = concatArgs('LSR ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
            break;
        case 2:
            regs[destinationReg] = regs[sourceReg]>>offset; // right arithmetic shift
            stringInstr = concatArgs('ASR ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
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
    var offset8 = instr&0xff;
    var destinationReg = instr>>8 & 0b111;
    var opCode = instr>>11 & 0b11;
    var stringInstr;
    switch(opCode){
        case 0:
            regs[destinationReg] = offset8;
            stringInstr = concatArgs('MOVS ','R',
                                     destinationReg,',#',offset8);
            
            zeroFlag = Number(offset8 == 0);
            offset8 < 0 ? negativeFlag = 1 : negativeFlag = 0;
            carryFlag = overflowFlag = 0;
            
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
            overflowFlag = isAddOverflowing(regs[destinationReg],-offset8);
            carryFlag = 0;
            stringInstr = concatArgs('CMP ','R',
                                     destinationReg,',#',offset);
            break;
        case 2:
            regs[destinationReg] = regs[destinationReg] + offset8;
            stringInstr = concatArgs('ADDS ','R',
                    destinationReg,',R',destinationReg,',#',offset);
            
            overflowFlag = isAddOverflowing(regs[destinationReg],offset8);
            regs[destinationReg] < 0 ? overflowFlag = 1 : overflowFlag = 0;
            zeroFlag = Number(regs[destinationReg] == 0);
            carryFlag  = 0;
            
            
            break;
        case 3:
            regs[destinationReg] = regs[destinationReg] - offset8;
            stringInstr = concatArgs('SUBS ','R',
                    destinationReg,',R',destinationReg,',#',offset);
            
            overflowFlag = isAddOverflowing(regs[destinationReg],-offset8);
            carryFlag = 0;
            stringInstr = concatArgs('CMP ','R',
                                     destinationReg,',#',offset);
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
    
    switch(opcode){
        case 0: // overflow detection not implemented
            regs[destinationReg] = regs[destinationReg] & regs[sourceReg];
            stringInstr = 'AND R'+destinationReg+',R'+sourceReg;
            
            overflowFlag = carryFlag = 0;
            negativeFlag = Number(regs[destinationReg] < 0);
            zeroFlag = Number(regs[destinationReg] == 0);
            break;
        case 1:
            regs[destinationReg] ^= regs[sourceReg];
            stringInstr = 'EOR R'+destinationReg+',R'+sourceReg;
            
            overflowFlag = carryFlag = 0;
            negativeFlag = Number(regs[destinationReg] < 0);
            zeroFlag = Number(regs[destinationReg] == 0);
            break;
        case 2:
            regs[destinationReg] = regs[destinationReg]<<regs[sourceReg];
            stringInstr = 'LSL R'+destinationReg+',R'+sourceReg;
            
            break;
        case 3:
            regs[destinationReg] = regs[destinationReg]>>regs[sourceReg];
            stringInstr = 'LSR R'+destinationReg+',R'+sourceReg;
            
            overflowFlag = carryFlag = 0;
            negativeFlag = Number(regs[destinationReg] < 0);
            zeroFlag = Number(regs[destinationReg] == 0);
            
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
            stringInstr = 'SBC R'++destinationReg+',R'+sourceReg;
            break;
        case 7:// rotate right
            var tmp = regs[destinationReg]>>regs[sourceReg];
            regs[destinationReg] = regs[destinationReg]<<(32-regs[sourceReg]);
            regs[destinationReg] |= tmp;
            stringInstr = 'ROR R'+destinationReg+',R'+sourceReg;
            break;
        case 8:// TST
            var result = regs[destinationReg] & regs[sourceReg];
            zeroFlag = result == 1 ? 1 : 0; // shouldnt zero flag = 1 when result = 0?
            negativeFlag = result < 0 ? 1 : 0;
            stringInstr = 'TSR';
            overflowFlag = carryFlag = 0;
            break;
        case 9:
            regs[destinationReg] = -regs[sourceReg];
            stringInstr = 'NEG R'+destinationReg+',R'+sourceReg;
            break;
        case 10://CMP
            var result = regs[destinationReg] - regs[sourceReg];
            zeroFlag = Number(result == 0);
            
            negativeFlag = result < 0 ? 1 : 0;
            carryFlag = 0;
            overflowFlag = isAddOverflowing(regs[destinationReg],-regs[sourceReg]);
            break;
        case 11:
            var result = regs[destinationReg] - regs[sourceReg];
            zeroFlag = Number(result == 0);
            
            negativeFlag = result < 0 ? 1 : 0;
            carryFlag = 0;
            overflowFlag = isAddOverflowing(regs[destinationReg],-regs[sourceReg]);
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
    'use strict';
    var rd = instr>>8 & 0b111;
    var word8 = instr>>8 & 255;
    regs[rd] = mem[word8+regs[15]];
    printInstruction('LDR R'+rd+'[PC,#'+word8+']');
}
// format 7
function loadStoreRegisterOffset(instr){
    'use strict';
    var offsetRegIndex = instr>>6&0b111;
    var baseRegisterIndex = instr>>3&0b111;// array index
    var offsetReg = regs[offsetRegIndex];
    var baseRegister = regs[baseRegisterIndex]; // regs value
    var registerSDNum = instr&0b111; // source/destination register index
    var stringInstr;
    if(instr>>11 & 1 == 0){ // checking L whether store or load
        mem[offsetReg+baseRegister] = registerSDNum&255; // get only first 8 bits
        if( (instr>>10) & 1 == 0){ // save the rest of word
          mem[offsetReg+baseRegister+1] = regs[registerSDNum]>>8 & 255;
          mem[offsetReg+baseRegister+2] = regs[registerSDNum]>>16 & 255;
          mem[offsetReg+baseRegister+3] = regs[registerSDNum]>>24 & 255;
          stringInstr = 'STRB';//  save one byte and return
        }else
            stringInstr = 'STR';
    }else{
        regs[registerSDNum] = mem[offsetReg+baseRegister];
        if( (instr>>10 & 1) == 0){
            regs[registerSDNum] |= mem[offsetReg+baseRegister+1]<<8; // load bits intro appropriate positons
            regs[registerSDNum] |= mem[offsetReg+baseRegister+2]<<16;
            regs[registerSDNum] |= mem[offsetReg+baseRegister+3]<<24;
            stringInstr = 'LDR';
        }else
            stringInstr = 'LDRB';
    }
    stringInstr += ' R,'+registerSDNum+'[R'+baseRegisterIndex+',R'+offsetRegIndex+']';
    printInstruction(stringInstr);
}
// format 9
function loadStoreWithImmOffset(instr){
    'use strict';
    var offset5 = instr>>3&0b111;
    var baseRegisterIndex = instr>>6&0b111;// array index
    var baseRegister = regs[baseRegisterIndex]; // regs value
    var registerSDNum = instr&0b111; // source/destination register index
    var stringInstr;
    if(instr>>11 & 1 == 0){ // checking L whether store or load
        mem[baseRegister+offset5] = registerSDNum&255; // get only first 8 bits
        if( (instr>>12) & 1 == 0){ // save the rest of word
          mem[offset5+baseRegister+1] = regs[registerSDNum]>>8 & 255;
          mem[offset5+baseRegister+2] = regs[registerSDNum]>>16 & 255;
          mem[offset5+baseRegister+3] = regs[registerSDNum]>>24 & 255;
          stringInstr = 'STRB';//  save one byte and return
        }else
            stringInstr = 'STR';
    }else{
            regs[registerSDNum] = mem[offset5+baseRegister];
        if( (instr>>10 & 1) == 0){
            regs[registerSDNum] |= mem[offset5+baseRegister+1]<<8; // load bits intro appropriate positons
            regs[registerSDNum] |= mem[offset5+baseRegister+2]<<16;
            regs[registerSDNum] |= mem[offset5+baseRegister+3]<<24;
            stringInstr = 'LDR';
        }else
            stringInstr = 'LDRB';
    }
    stringInstr += ' R'+registerSDNum+' ,[R'+baseRegisterIndex+',#'+offset5+']';
    printInstruction(stringInstr);
}
//format 13
function addOffsetStackPointer(instr){
    var immediate = instr & 0x3f;
    if((instr>>7&1) == 1)
        immediate = -immediate;
    regs[13] += immediate;
    printInstruction('ADD SP,#',immediate);
}
//format 18
function unconditionalBranch(instr){
    var offsetvalue= instr >> 10 & 0b1111111111;    //extract offset value
        offsetvalue=offsetvalue-2;  //to account for pc increment
}
// format 19 // not implemented yet
function longBranchWithLink(instr){
    var offset = (instr&0x3ff);
        
    if(instr>>11 & 1 == 1)
    else offset = (instr&0x3ff);
}
//format 16
function conditionalBranch(instr){
    "use strict";
    var instrString = '';
    var cond = instr>>8 & 0xf;
    var offset = instr & 0xff;
    switch(cond){
        case 0;
            if(zeroFlag == 1)  regs[PC] += (offset)*4;
            instrString = 'BEQ';
            break;
        case 1:
            if(zeroFlag  == 0) regs[PC] += (offset)*4;
            instrString = 'BNE';
            break;
        case 2:
            if(carryFlag == 1) regs[PC] += (offset)*4;
            instrString = 'BCS';
            break;
        case 3:
            if(carryFlag == 0) regs[PC] += (offset)*4;
            instrString = 'BCC';
            break;
        case 4:
            if(negativeFlag == 1) regs[PC] += (offset)*4;
            instrString = 'BMI';
            break;
        case 5:
            if(negativeFlag == 0) regs[PC] += (offset)*4;
            instrString = 'BPL';
            break;
        case 6:
            if(overflowFlag == 1) regs[PC] += (offset)*4;
            instrString = 'BVS';
            break;
        case 7:
            if(overflowFlag == 0) regs[PC] += (offset)*4;
            instrString = 'BCS';
            break;
        case 8:
            if(carryFlag == 1 && zeroFlag == 0) regs[PC] += (offset)*4;
            instrString = 'BHI';
            break;
        case 9:
            if(carryFlag == 0 || zeroFlag == 1) regs[PC] += (offset)*4;
            instrString = 'BLS';
            break;
        case 10:
            if(negativeFlag == overflowFlag) regs[PC] += (offset)*4;
            instrString = 'BGE';
            break;
        case 11:
            if(negativeFlag != overflowFlag) regs[PC] += (offset)*4;
            instrString = 'BLT';
            break;
        case 12:
            if(zeroFlag == 0 && (negativeFlag == overflowFlag))
                regs[PC] += (offset)*4;
            instrString = 'BGT';
            break;
        case 13:
            if(zeroFlag == 1 || negativeFlag == overflowFlag)
                regs[PC] += (offset)*4;
            instrString = 'BLE';
            break;
    }
    instrString += ' ' + offset;
    printInstruction(instrString);
}
// concatinates all strings and integers into a string
function concatArgs(){
    var str = '';
    for (var i = 0; i < arguments.length; i++) {
        str = str + arguments[i];
    }
    return str;
}
// format 14
function pushPopRegisters(instr){
    "use strict";
    var instrString = '';
    if(instr>>11 & 1 == 0){ // push regs
        instrString = 'PUSH{ ';
        for(var i = 0; i < 8;i++){
            if(instr>>i & 1 == 1){
                regs[STACK_POINTER] -= 4;
                mem[regs[STACK_POINTER]] = regs[i]>>8 & 255;
                mem[regs[STACK_POINTER]+1] = regs[i]>>8 & 255;
                mem[regs[STACK_POINTER]+2] = regs[i]>>16 & 255;
                mem[regs[STACK_POINTER]+3] = regs[i]>>24 & 255;
                instrString += 'R'+i+',';
            }
        }
        if(instr>>8 & 1 == 1){ // save lr reg
            regs[STACK_POINTER] -= 4;
            mem[regs[STACK_POINTER]] = regs[LR]>>8 & 255;
            mem[regs[STACK_POINTER]+1] = regs[LR]>>8 & 255;
            mem[regs[STACK_POINTER]+2] = regs[LR]>>16 & 255;
            mem[regs[STACK_POINTER]+3] = regs[LR]>>24 & 255;
            instrString += 'R'+LR;
        }
    }else{ // pop regs
        instrString = 'POP{ ';
        for(var i = 0; i < 8;i++){
            if(instr>>i & 1 == 1){
                regs[i]  = mem[regs[STACK_POINTER]];
                regs[i] |= mem[regs[STACK_POINTER]+1]<<8;
                regs[i] |= mem[regs[STACK_POINTER]+2]<<16;
                regs[i] |= mem[regs[STACK_POINTER]+3]<<24;
                regs[STACK_POINTER] += 4;
                instrString += 'R'+i+',';
            }
        }
        if(instr>>8 & 1 == 1){
                regs[PC]  = mem[regs[STACK_POINTER]];
                regs[PC] |= mem[regs[STACK_POINTER]+1]<<8;
                regs[PC] |= mem[regs[STACK_POINTER]+2]<<16;
                regs[PC] |= mem[regs[STACK_POINTER]+3]<<24;
                regs[STACK_POINTER] += 4;
                instrString += 'R'+PC;
         }
    }
    if(instrString.length == instrString.lastIndexOf(','))
        instrString = instrString.substr(0,instrString-1); // remove last comma
    printInstruction(instrString+'}');
}
// disables step and start buttons
function terminateProgram(status){

}
// format 17
function softwareInterrupt(instr){

}
/*
// format 10 not required
function loadStoreHalfword(instr){
    'use strict';
    var offset5 = instr>>6&0b11111;
    var baseRegisterIndex = instr>>3&0b111;// array index
    var baseRegister = regs[baseRegisterIndex]; // regs value
    var registerSDNum = instr&0b111; // source/destination register index
    var stringInstr;
    if(instr>>11 & 1 == 0){ // checking L whether store or load
        mem[baseRegister+offset5] = registerSDNum&255; // get only first 8 bits
        mem[offset5+baseRegister+1] = regs[registerSDNum]>>8 & 255;
        stringInstr = 'STRH';//  save one byte and return
        }
    else{
        regs[registerSDNum] = mem[offset5+baseRegister];
        regs[registerSDNum] |= mem[offset5+baseRegister+1]<<8; // load bits intro appropriate positons
        stringInstr = 'LDRH';
        }
    stringInstr += ' R'+registerSDNum+' ,[R'+baseRegisterIndex+',#'+offset5+']';
    printInstruction(stringInstr);
} */
/*
// format 11 not required
function SPloadStore(instr){
    var immediate = instr & 0b11111111;
    var destinationReg = instr >> 8 & 0b111;
    var result = immediate + reg[13];
    var stringInstr;
    if (instr >> 11 & 1 == 0) {
        mem[result] = regs[destinationReg] & 255;
        mem[result + 1] = regs[destinationReg] >> 8 & 255;
        mem[result + 2] = regs[destinationReg] >> 16 & 255;
        mem[result + 3] = regs[destinationReg] >> 32 & 255;
        stringInstr = "STR ";
    }
    else {
        regs[destinationReg] = mems[result];
        regs[destinationReg] |= mems[result + 1] << 8;
        regs[destinationReg] |= mems[result + 2] << 16;
        regs[destinationReg] |= mems[result + 3] << 32;
        stringInstr = "LDR ";
    }
    stringInstr += 'R' + destinationReg + ",[R13] #" + immediate + ']';
    printInstruction(stringInstr);
} */
/*
// format 12 not required
function loadAddress(instr) {
    var immediate = instr & 0b11111111;
    var destinationReg = intsr >> 8 & 0b111;
    var stringInstr = "ADD R";
    if (inst >> 11 & 1 == 0) {
        regs[destinationReg] = mems[immediate + regs[15]];
        regs[destinationReg] = mems[immediate + regs[15] + 1] << 8;
        regs[destinationReg] = mems[immediate + regs[15] + 2] << 16;
        regs[destinationReg] = mems[immediate + regs[15] + 3] << 32;
        stringInstr += destinationReg + ", R15, #" + immediate;
    }
    else {
        regs[destinationReg] = mems[immediate + regs[13]];
        regs[destinationReg] = mems[immediate + regs[13] + 1] << 8;
        regs[destinationReg] = mems[immediate + regs[13] + 2] << 16;
        regs[destinationReg] = mems[immediate + regs[13] + 3] << 32;
        stringInstr += destinationReg + ", R13, #" + immediate;
    }
    printInstruction(stringInsr);
} */
// determines if answer will overflow
function isAddOverflowing(x,y){
    var result = Number(x)+Number(y);
    return Number(result != (x+y));
}