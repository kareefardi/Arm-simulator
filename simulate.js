var STACK_POINTER = 13;// stack pointer index
var LR = 14; // link and return index
var PC = 15;
var mem = new Uint8Array(2048);
var regs = new Int32Array(16);

regs[15] = 4; // set program counter 2 since its always 2 instructions ahaed of what we execture
var zeroFlag = 0,negativeFlag = 0,carryFlag = 0, overflowFlag = 0;
// conditons flags for implemented formats 1-4 not implemented

function start(){
    simulate(0b1011010111111111);
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
        console.log("instr "+instrLoc);

        regs[15] += 2; // increment by one
        printRegisterContent(regs);
    }else{ // disable buttons of step and start since execution finished
        console.log('program execution done');
        console.log(mem.length + " and pc " + regs[PC]);
    }
}
// returns binary format of decimal numbers
function dec2bin(dec){
    return (dec >>> 0).toString(2);
}

function simulate(instr) {
    "use strict";
    var fmt = instr>>13; // discard all but last 3 bits used for format identification
//    console.log('simulate case '+fmt);
    switch(fmt){
        case 0b000: // for format zero check whether to add/subtract or shift register
            (instr >> 11 & 0b11) == 3 ? addSubtract(instr) : moveShiftedRegister(instr);
          break;

        case 0b001: // arithmetic operations with immediate value
            arithmeticImediate(instr);
            break;

        case 0b010: // format 4 & 6 & 7
            if (instr >> 10 == 0x10)
                alu(instr); // alu operations format 4
            else if (instr >> 11 & (0b01001) == (0b01001))
                pcRelativeLoad(instr); // format 6
            else if (instr >> 12 & (0b0101) == (0b0101))
                loadStoreRegisterOffset(instr); // format 7
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
<<<<<<< HEAD
			if((instr >> 9 & 0b10) == 0b10) pushPopRegisters(instr);
=======
            if((instr >> 8 & 0xb0) == 0xb0) addOffsetStackPointer(instr); // format
>>>>>>> 4ac4b642d85f3d4d65c58ccd0afb7feae1577df7
            else {
                addOffsetStackPointer(instr); // format
        /*        if ((instr >> 12 & 1) == 1) {
                    pushPopRegisters(instr); // format 14
                }else {
                    loadAddress(instr);
                }  */
            }
            break;

        case 0b110: // format 15 & 16 & 17
<<<<<<< HEAD
            if((instr>>8 & 0x1f) == 0x1f) softwareInterrupt(instr); // format 17
			else {
                 if ((instr >> 12 & 1) == 1){
=======
            if((instr>>8 & 0b11111) == 0b11111) softwareInterrupt(instr); // format 17
            else {
                 if ((instr >> 12 & 1) == 1)
>>>>>>> 4ac4b642d85f3d4d65c58ccd0afb7feae1577df7
                    conditionalBranch(instr); // format 16
                }
                /* else
                    multLoadStore(instr); // format 15 */
            }
            break;

        case 0b111: // format 18 & 19
            if(instr>>12 == 0xf){
                console.log('long and branch');
                longBranchWithLink(instr);// format 19
<<<<<<< HEAD
            }
			else unconditionalBranch(instr); // format 18
=======
            else unconditionalBranch(instr); // format 18
>>>>>>> 4ac4b642d85f3d4d65c58ccd0afb7feae1577df7

            break;
        case 0xdead: // terminate program
            terminateProgram(0); // zero for exit_success
            break;
        default:
            break;
    }
}

//format 2 completed condition codes
function addSubtract(instr){
    "use strict";
    var offsetNReg = instr>>6 & 0b111; // register id or immediate value depending
    var destinationReg = instr & 0b111;     // on op immediate flag
    var sourceReg = instr>>3 & 0b111;
    var immediateFlag = instr>>10 & 0b1;
    var opCode = instr>>9 & 0b1;
    var stringInstr;

    if(opCode == 0){ // add
        stringInstr = "ADD R" + destinationReg + ", R" + sourceReg;
        if(immediateFlag == 1){
            stringInstr += ", #" + offsetNReg;
            regs[destinationReg] =  regs[sourceReg] + offsetNReg;

            overflowFlag = isAddOverflowing(regs[sourceReg],offsetNReg,regs[destinationReg]);
            carryFlag = isAddGenCarry(regs[sourceReg],offsetNReg);

         }else{
            stringInstr += ", R" + offsetNReg;
            regs[destinationReg] = regs[sourceReg] + regs[offsetNReg];

            overflowFlag = isAddOverflowing(regs[sourceReg],regs[offsetNReg],regs[destinationReg]);
            carryFlag = isAddGenCarry(regs[sourceReg],regs[offsetNReg]);
        }
    }else{ // subtract
        stringInstr = "SUB R" + destinationReg + ", R" + sourceReg;
         if(immediateFlag == 1){
            stringInstr += ", #" + offsetNReg;
            regs[destinationReg] = regs[sourceReg] - offsetNReg;

            // adding negative since this is equivalent to addition with negative of second operant
            overflowFlag = isAddOverflowing(regs[sourceReg],-offsetNReg,regs[destinationReg]);
            carryFlag = isAddGenCarry(regs[sourceReg],-offsetNReg);
        }else{
            stringInstr += ", R" + offsetNReg;
            regs[destinationReg] = regs[sourceReg] - regs[offsetNReg];

            overflowFlag = isAddOverflowing(regs[sourceReg],-regs[offsetNReg],regs[destinationReg]);
            carryFlag = isAddGenCarry(regs[sourceReg],-regs[offsetNReg]);
        }
    }
    zeroFlag = Number(regs[destinationReg] == 0);
    negativeFlag = Number(regs[destinationReg] < 0);
    printInstruction(stringInstr);
}


// format 1 condition flags done
function moveShiftedRegister(instr){
    "use strict";
    var offset = instr>>6 & 0b11111; // extract offset
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = instr>>11 & 0b11;
    var stringInstr; // string representation of instruction
    switch(opcode){
        case 0:
            if(regs[sourceReg] != 0)
                carryFlag = regs[sourceReg] & 1<<(32-offset);
            regs[destinationReg] = regs[sourceReg]<<offset; // left arthmetic shift
            stringInstr = concatArgs('LSL ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
            break;
        case 1:
            if(regs[sourceReg] != 0)
                carryFlag = regs[sourceReg]>>(regs[sourceReg]-1) & 1;
            regs[destinationReg] = regs[sourceReg]>>offset; // right logical shift
            stringInstr = concatArgs('LSR ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
            break;
        case 2:
            if(regs[sourceReg] != 0)
                carryFlag = regs[destinationReg]>>>(regs[sourceReg]-1) & 1;
            regs[destinationReg] = regs[sourceReg]>>>offset; // right arithmetic shift
            stringInstr = concatArgs('ASR ','R',destinationReg
                                     ,',','R',sourceReg,',','#',offset);
            break;
        default:
            console.log('move shifted register unknown operation');
            stringInstr = 'unknown instruction';
            break;
    }
    zeroFlag = Number(regs[destinationReg] == 0);
    negativeFlag = Number(regs[destinationReg] < 0);
    printInstruction(stringInstr);
}
// format 3,  condition codes done
function arithmeticImediate(instr){
    "use strict";
    var offset8 = instr&0xff;
    var destinationReg = instr>>8 & 0b111;
    var opCode = instr>>11 & 0b11;
    var stringInstr;
    switch(opCode){
        case 0:
            regs[destinationReg] = offset8;
            stringInstr = concatArgs('MOV ','R',
                                     destinationReg,',#',offset8);
            zeroFlag = Number(regs[destinationReg] == 0);
            negativeFlag = Number(regs[destinationReg] < 0);
            break;
        case 1:
            var tmp = regs[destinationReg] - offset8;

            zeroFlag = Number(tmp == 0);
            negativeFlag = Number(tmp < 0);
            overflowFlag = isAddOverflowing(regs[destination],-offset8,tmp);
            carryFlag = isAddGenCarry(regs[destination],-offset8);
            break;
        case 2:
            overflowFlag = isAddOverflowing(regs[destination],
                offset8,regs[destination]+offset8);
            carryFlag = isAddGenCarry(regs[destination],offset8);

            regs[destinationReg] = regs[destinationReg] + offset8;
            stringInstr = concatArgs('ADD ','R',
                    destinationReg,',R',destinationReg,',#',offset);

            zeroFlag = Number(regs[destination] == 0);
            negativeFlag = Number(regs[destination] < 0);

            break;
        case 3:
            overflowFlag = isAddOverflowing(regs[destination],
                offset8,regs[destination]+offset8);
            carryFlag = isAddGenCarry(regs[destination],offset8);

            regs[destinationReg] = regs[destinationReg] - offset8;
            stringInstr = concatArgs('SUB ','R',
                    destinationReg,',R',destinationReg,',#',offset8);

            zeroFlag = Number(regs[destination] == 0);
            negativeFlag = Number(regs[destination] < 0);
            break;
    }
    printInstruction(stringInstr);
}
//format 4 complete
function alu(instr){
    "use strict";
    var destinationReg = instr & 0b111;
    var sourceReg = instr>>3 & 0b111;
    var opcode = instr>>6 & 0xf;
    var stringInstr;

//    console.log('alu called');

    switch(opcode){
        case 0: // flags done at endof switch
            regs[destinationReg] = regs[destinationReg] & regs[sourceReg];
            stringInstr = 'AND R'+destinationReg+',R'+sourceReg;

            break;
        case 1:// flags done
            regs[destinationReg] ^= regs[sourceReg];
            stringInstr = 'EOR R'+destinationReg+',R'+sourceReg;

            break;
        case 2://flags done
            //check carry out
            if(regs[sourceReg] != 0)
                carryFlag = regs[destinationReg] & 1<<(32-regs[sourceReg]);
            regs[destinationReg] = regs[destinationReg]<<regs[sourceReg];
            stringInstr = 'LSL R'+destinationReg+',R'+sourceReg;

            break;
        case 3:// done flags
            if(regs[sourceReg] != 0)
                carryFlag = regs[destinationReg]>>(regs[sourceReg]-1) & 1;
            regs[destinationReg] = regs[destinationReg]>>regs[sourceReg];
            stringInstr = 'LSR R'+destinationReg+',R'+sourceReg;

            break;
        case 4:// done
            if(regs[sourceReg] != 0)
                carryFlag = regs[destinationReg]>>>(regs[sourceReg]-1) & 1;
            regs[destinationReg] = regs[destinationReg]>>>regs[sourceReg];
            stringInstr = 'ASR R'+destinationReg+',R'+sourceReg;

           break;
        case 5:
            var tmp = regs[destinationReg];
            regs[destinationReg] += regs[sourceReg];
            regs[destinationReg] += carryFlag;
            stringInstr = 'ADC R'+destinationReg+',R'+sourceReg;

            overflowFlag  = isAddOverflowing(tmp,reg[sourceReg]);
            overflowFlag |= isAddOverflowing(tmp+regs[sourceReg],carryFlag);
            var carry = Number(tmp)+Number(regs[sourceReg])+carryFlag;
            carryFlag = carry>>32; //extract
            break;
        case 6:
            var tmp = regs[destinationReg];
            regs[destinationReg] -= regs[sourceReg];
            regs[destinationReg] -= (carryFlag); // and with one since carry flag should be 1 bit amd carryhere is i
            stringInstr = 'SBC R' + destinationReg+',R'+sourceReg;

            overflowFlag  = isAddOverflowing(tmp,-reg[sourceReg]);
            overflowFlag |= isAddOverflowing(tmp-regs[sourceReg],-carryFlag);
            var carry = Number(tmp)-Number(regs[sourceReg])-carryFlag;
            carryFlag = carry>>32; //extract
            break;
        case 7:// rotate right //not sure of c flag status
            var tmp = regs[destinationReg]<<(32-regs[sourceReg]);
            regs[destinationReg] = regs[destinationReg]>>regs[sourceReg];
            regs[destinationReg] |= tmp;
            stringInstr = 'ROR R'+destinationReg+',R'+sourceReg;

            break;
        case 8:// TST print inside since it doesnt have result in destination reg
            var result = regs[destinationReg] & regs[sourceReg];
            stringInstr = 'TST R' + destinationReg + ', R' + sourceReg;

            zeroFlag = Number(result == 0);
            negativeFlag = Number(result < 0);
            printInstruction(stringInstr);
            return;
            break;
        case 9:
            regs[destinationReg] = -regs[sourceReg];
            stringInstr = 'NEG R'+destinationReg+',R'+sourceReg;
            break;
        case 10://CMP
            var result = regs[destinationReg] - regs[sourceReg];

            zeroFlag = Number(result == 0);
            negativeFlag = Number(result < 0);
            printInstruction(stringInstr);
            return;
            break;
        case 11:
            var result = regs[destinationReg] - regs[sourceReg];

            zeroFlag = Number(result == 0);
            negativeFlag = Number(result < 0);
            printInstruction(stringInstr);
            return;

            break;
        case 12:
            regs[destinationReg] |= regs[sourceReg];
            stringInstr = 'ORR R'+destinationReg+',R'+sourceReg;
            break;
        case 13:// c and v unchanged since he wants corruption
            regs[destinationReg] *= regs[sourceReg];
            stringInstr = 'MUL R'+destinationReg+',R'+sourceReg;
            break;
        case 14:
            regs[destinationReg] = regs[destinationReg] & (~regs[sourceReg]);
            stringInstr = 'BIC R'+destinationReg+',R'+sourceReg;
            break;
        default: // opcode 1111 // left because unknown
            regs[destinationReg] = ~regs[sourceReg];
            stringInstr = 'MVN R'+destinationReg+',R'+sourceReg;
            break;
    }//common case for all
    zeroFlag = Number(regs[destinationReg] == 0);
    negativeFlag = Number(regs[destinationReg] < 0);
    printInstruction(stringInstr);
}
// format 6
function pcRelativeLoad(instr){
    'use strict';
    var rd = instr>>8 & 0b111;
    var word8 = instr>>8 & 255; // check doc notes
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
          stringInstr = 'STR';
        }else
            stringInstr = 'STRB';
    }else{
        regs[registerSDNum] = mem[offsetReg+baseRegister]&255;
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
    var offset5 = instr>>6&0x3f;
    var baseRegisterIndex = instr>>3&0b111;// array index
    var baseRegister = regs[baseRegisterIndex]; // regs value
    var registerSDNum = instr&0b111; // source/destination register index
    var stringInstr;
    if(instr>>11 & 1 == 0){ // checking L whether store or load
        mem[baseRegister+offset5] = registerSDNum&255; // get only first 8 bits
        if( (instr>>12) & 1 == 0){ // save the rest of word
          mem[offset5+baseRegister+1] = regs[registerSDNum]>>8 & 255;
          mem[offset5+baseRegister+2] = regs[registerSDNum]>>16 & 255;
          mem[offset5+baseRegister+3] = regs[registerSDNum]>>24 & 255;
          stringInstr = 'STR';
        }else
            stringInstr = 'STRB';
    }else{
            regs[registerSDNum] = mem[offset5+baseRegister]&255;
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
    var immediate = instr & 0x7f;
    if((instr>>7&1) == 1)
        immediate = -immediate;
    regs[13] += immediate;
    printInstruction('ADD SP,#'+immediate);
}
//format 18
function unconditionalBranch(instr){
<<<<<<< HEAD
    "use strict";
    var offset5 = instr & 0x7ff;
    var stringInstr = "B " + (offset5 * 2); // supposed to be label
    regs[PC] += offset5 * 2 ;
=======
    var offset11 = instr & 0x7ff;
    //sign extend and mult by 2
    offset11 = offset11 << 1;
    offset11 = offset11 >>> 1;
    offset11 = offset11 << 1;

    var stringInstr = "B " + offset11;
    regs[PC] += offset11 ;
>>>>>>> 4ac4b642d85f3d4d65c58ccd0afb7feae1577df7
    printInstruction(stringInstr);
}

// format 19
function longBranchWithLink(instr){
    var offset = instr & 0x7ff;
    offset = offset << 1;
    offset = ofset >>> 1;
    if ((instr >> 11 & 1) == 0) {
		var tmp = offset<<12;

        regs[LR] = regs[PC] + (offset<<12);
    }
    else {
<<<<<<< HEAD
        var tmp = regs[PC] ;//- 1;
        regs[PC] = regs[LR] + (offset<<1);
        regs[LR] = tmp | 1;
=======
        var tmp = regs[PC] ;// address of next instruction = tmp ?
        regs[PC] = regs[LR] + offset<<1;
        regs[LR] = tmp | 1; 
>>>>>>> 4ac4b642d85f3d4d65c58ccd0afb7feae1577df7
    }
    var stringInstr = "BL " + offset; // supposed to be label
    printInstruction(stringInstr);
}
//format 16
function conditionalBranch(instr){
    "use strict";
    var instrString = '';
    var cond = instr>>8 & 0xf;
    var offset = instr & 0xff;
    //sign extend
    offset = offset << 1;
    offset = offset >>> 1;
    // mult * 2 or shift by one
    offset = offset << 1;

    switch(cond){
        case 0:
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
                regs[PC] += (offset);
            instrString = 'BGT';
            break;
        case 13:
            if(zeroFlag == 1 || negativeFlag == overflowFlag)
                regs[PC] += (offset);
            instrString = 'BLE';
            break;
        default:
            instrString ='Undefined instr';
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
            if((instr>>i & 1) == 1){
                regs[STACK_POINTER] -= 4;
                mem[regs[STACK_POINTER]] = regs[i] & 0xff;//chk
                mem[regs[STACK_POINTER]+1] = regs[i]>>8 & 255;
                mem[regs[STACK_POINTER]+2] = regs[i]>>16 & 255;
                mem[regs[STACK_POINTER]+3] = regs[i]>>24 & 255;
                instrString += 'R'+i+',';
            }
        }
        if((instr>>8 & 1) == 1){ // save lr reg
            regs[STACK_POINTER] -= 4;
            mem[regs[STACK_POINTER]] = regs[LR] & 0xff;//chk
            mem[regs[STACK_POINTER]+1] = regs[LR]>>8 & 255;
            mem[regs[STACK_POINTER]+2] = regs[LR]>>16 & 255;
            mem[regs[STACK_POINTER]+3] = regs[LR]>>24 & 255;
            instrString += 'LR';
        }
    }else{ // pop regs
        instrString = 'POP{ ';
        for(var i = 0; i < 8;i++){
            if((instr>>i) & 1 == 1){
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
                instrString += 'PC';
         }
    }
//    if(instrString.length == instrString.lastIndexOf(','))
//        instrString = instrString.substr(0,instrString-1); // remove last comma
    printInstruction(instrString+'}');
}
// disables step and start buttons
function terminateProgram(status){
    console.log('program terminated');
}
// format 17 not implemented yet
function softwareInterrupt(instr){
    printInstruction('swi');
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
function isAddOverflowing(x,y,z){
    var overflow;
    if(x < 0 && y < 0 && z >= 0)
        overflow = 1;
    else if(x > 0 && y > 0 && z < 0)
        overflow = 1;
    else
        overflow = 0;
    return overflow;
}

function isAddGenCarry(x,y){
    if((x >= 0 && y < 0) || (x < 0 && y >= 0))
        return 0; // no carry if opposite signs
    if(x < 0&& y < 0)
        return Number((Number(x) + Number(y))>>32 & 1 == 0); // carry for negative if bit zero
    return (Number(x) + Number(y))>>32 & 1;
}

//check notes for immediates ie
/*#Imm is a full 7-bit address, but must
be word-aligned (ie with bits 1:0 set to 0), since the assembler places #Imm >> 2 in
the Offset5 field.
*/
// dk if important
