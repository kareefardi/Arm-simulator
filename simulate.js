var mem = new Uint8Array(2048);
var regs = new Int32Array(16);

regs[15] = 4; // set program counter 2 since its always 2 instructions ahaed of what we execture
var zeroFlag = 0,negativeFlag = 0,carryFlag = 0, overflow = 0;
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

        case 0b101: // format 13 &  14
			if((instr >> 11 & 0b10) == 0b10) addOffsetStackPointer(instr); // format 13
            else
                pushPopRegisters(instr); // format 14
            break;

        case 0b110: // format 16 & 17
			if((instr>>8 & 0b11111) == 0b11111) softwareInterrupt(instr); // format 17
			else conditionalBranch(instr); // format 16
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
    switch(opcode){
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
            zeroFlag = result ? 1 : 0; // shouldnt zero flag = 1 when result = 0?
            negativeFlag = result < 0 ? 1 : 0;
            stringInstr = 'TSR';
            //The carry flag is updated to the last bit shifted out of Rm
            */
            break;
        case 9:
            regs[destinationReg] = -regs[sourceReg];
            stringInstr = 'NEG R'+destinationReg+',R'+sourceReg;
            break;
        case 10://CMP
            /*var result = regs[destinationReg] - regs[sourceReg];
            zeroFlag = !(result);
            negativeFlag = result < 0 ? 1 : 0;
            carryFlag = 
            break;
            */
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
    'use strict';
    var rd = instr>>8 & 0b111;
    var word8 = instr>>8 & 255;
    regs[rd] = mem[word8+regs[15]];
    printInstruction('LDR R'+rd+'[PC,#'+word8+']');
}
// format 7
function loadStoreRegisterOffset(instr){
    'use strict';
    var offsetRegIndex = instr>>3&0b111;
    var baseRegisterIndex = instr>>6&0b111;// array index
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
// format 9 // now has format 7 code
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
function unconditionalBranch(instr){
    var offsetvalue= instr >> 10 & 0b1111111111;    //extract offset value
        offsetvalue=offsetvalue-2;  //to account for pc increment
}
function longBranchWithLink(instr){

}
function conditionalBranch(instr){

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

}

function terminateProgram(status){

}

function softwareInterrupt(instr){
    
}
// format 10
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
}
// format 11
function SPloadStore(instr){
    var immediate = instr & 0b11111111;
    var destinationReg = instr >> 8 & 0b111;
    var result = immediate + reg[13];
    varstringInstr;
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
}