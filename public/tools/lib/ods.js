const table = getTable();

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export default function ods(data) {
  const res = [];
  let line = '';

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (i === 0) {
      const SOF = Array.from(data.slice(i + 4, i + 6));

      if (SOF[0] !== 255 || SOF[1] !== 0) {
        // could this be the old format? - sod it, try anyway.
        console.warn('Either not ODS file or old format');
      } else {
        i += 5; // skip over the initial zero/start of line
        continue;
      }
    }

    if (byte === 0) {
      // start of new line
      res.push(line);
      line = '';
      continue;
    } else if (byte === 255) {
      // end of file
      break;
    }

    if (byte === 10) {
      // next byte is number of spaces
      const spaces = ' '.repeat(data[i + 1]);

      line += spaces;

      // now the opcode

      if (i === 0 && data[i + 2] === 0) {
        // weird pre-header format
        i++;
        continue;
      }

      const opcode = table.opcodes[data[i + 2]];

      // peek
      if (data[i + 3] === 1) {
        line += opcode[1];
        i++;
      } else {
        line += opcode[0];
      }

      i += 2;

      continue;
    }

    const opand = table.opands[byte];

    if (opand) {
      // peek
      if (data[i + 1] === 1) {
        line += opand[1];
        i++;
      } else {
        line += opand[0];
      }
      continue;
    }

    line += String.fromCharCode(byte);
  }

  return res.join('\n'); // ?
}

function getTable() {
  return {
    opcodes: {
      0x80: { 0: 'ADC ' },
      0x81: { 0: 'ADD ' },
      0x82: { 0: 'AND ' },
      0xe0: { 0: 'BIN ', 1: 'INCBIN ' },
      0x83: { 0: 'BIT ' },
      0xcf: { 0: 'BSLA ' },
      0xd3: { 0: 'BRLC ' },
      0xd0: { 0: 'BSRA ' },
      0xd2: { 0: 'BSRF ' },
      0xd1: { 0: 'BSRL ' },
      0x84: { 0: 'CALL ' },
      0x85: { 0: 'CCF' },
      0x86: { 0: 'CP ' },
      0x87: { 0: 'CPD' },
      0x88: { 0: 'CPDR' },
      0x89: { 0: 'CPI' },
      0x8a: { 0: 'CPIR' },
      0x8b: { 0: 'CPL' },
      0x8c: { 0: 'DAA' },
      0x8d: { 0: 'DEC ' },
      0x8e: { 0: 'DB ', 1: 'DEFB ' },
      0x90: { 0: 'DS ', 1: 'DEFS ' },
      0x91: { 0: 'DW ', 1: 'DEFW ' },
      0x8f: { 0: 'DZ ', 1: 'DEFZ ' },
      0x92: { 0: 'DI' },
      0x94: { 0: 'DJNZ ' },
      0x95: { 0: 'EI' },
      0x96: { 0: 'ENT' },
      0x97: { 0: 'EQU ' },
      0x98: { 0: 'EX ' },
      0x99: { 0: 'EXX' },
      0x9a: { 0: 'HALT' },
      0x9b: { 0: 'IM ' },
      0x9c: { 0: 'IN ' },
      0x9d: { 0: 'INC ' },

      0x9e: { 0: 'IND' },
      0x9f: { 0: 'INDR' },
      0xa0: { 0: 'INI' },
      0xa1: { 0: 'INIR' },
      0xa2: { 0: 'JP ' },
      0xa3: { 0: 'JR ' },
      0xa4: { 0: 'LD ' },
      0xa5: { 0: 'LDD' },
      0xa6: { 0: 'LDDR' },
      0xdf: { 0: 'LDRX', 1: 'LDDRX' },
      0xdc: { 0: 'LDDX' },
      0xa7: { 0: 'LDI' },
      0xa8: { 0: 'LDIR' },

      0xda: { 0: 'LDIX' },

      0xdb: { 0: 'LDWS' },
      0xdd: { 0: 'LIRX', 1: 'LDIRX' },
      0xe1: { 0: 'LOAD ', 1: 'INCLUDE ' },
      0xde: { 0: 'LPRX', 1: 'LDPIRX' },
      0xcd: { 0: 'MIRR', 1: 'MIRROR' },
      0xd4: { 0: 'MUL' },
      0xa9: { 0: 'NEG' },
      0xd6: { 0: 'NREG ', 1: 'NEXTREG ' },
      0xaa: { 0: 'NOP' },
      0x93: { 0: 'OPT ' },
      0xab: { 0: 'OR ' },
      0xac: { 0: 'ORG ' },
      0xad: { 0: 'OTDR' },
      0xd5: { 0: 'OTIB', 1: 'OUTINB' },
      0xae: { 0: 'OTIR' },
      0xaf: { 0: 'OUT ' },
      0xb0: { 0: 'OUTD' },
      0xb1: { 0: 'OUTI' },

      0xd8: { 0: 'PXAD', 1: 'PIXELAD' },
      0xd7: { 0: 'PXDN', 1: 'PIXELDN' },
      0xb2: { 0: 'POP ' },
      0xb3: { 0: 'PUSH ' },
      0xb4: { 0: 'RES ' },
      0xb5: { 0: 'RET' },
      0xb6: { 0: 'RETI' },
      0xb7: { 0: 'RETN' },
      0xb8: { 0: 'RL ' },
      0xb9: { 0: 'RLA' },
      0xba: { 0: 'RLC ' },
      0xbb: { 0: 'RLCA' },
      0xbc: { 0: 'RLD' },
      0xbd: { 0: 'RR ' },
      0xbe: { 0: 'RRA' },
      0xbf: { 0: 'RRC ' },
      0xc0: { 0: 'RRCA' },
      0xc1: { 0: 'RRD' },
      0xc2: { 0: 'RST ' },
      0xc3: { 0: 'SBC ' },
      0xc4: { 0: 'SCF' },
      0xc5: { 0: 'SET ' },
      0xcb: { 0: 'SL1 ' },
      0xc6: { 0: 'SLA ' },
      0xc7: { 0: 'SRA ' },
      0xc8: { 0: 'SRL ' },
      0xd9: { 0: 'STAE', 1: 'SETAE' },
      0xc9: { 0: 'SUB ' },
      0xcc: { 0: 'SWAP', 1: 'SWAPNIB' },
      0xce: { 0: 'TEST ' },
      0xca: { 0: 'XOR ' },
    },
    opands: {
      0x9a: { 0: '<<' },
      0x9b: { 0: '>>' },
      0x87: { 0: 'A' },
      0x86: { 0: "AF'" },
      0x8c: { 0: 'AF' },
      0x80: { 0: 'B' },
      0x88: { 0: 'BC' },
      0x81: { 0: 'C' },
      0x82: { 0: 'D' },
      0x89: { 0: 'DE' },
      0x83: { 0: 'E' },
      0x84: { 0: 'H' },
      0x8a: { 0: 'HL' },
      0x8d: { 0: 'I' },
      0x8e: { 0: 'IX' },
      0x8f: { 0: 'IY' },
      0x85: { 0: 'L' },
      0x90: { 0: 'M' },
      0x9c: { 0: 'MOD' },
      0x91: { 0: 'NC' },
      0x92: { 0: 'NV' },
      0x93: { 0: 'NZ' },
      0x94: { 0: 'P' },
      0x95: { 0: 'PE' },
      0x96: { 0: 'PO' },
      0x97: { 0: 'R' },
      0x8b: { 0: 'SP' },
      0x98: { 0: 'V' },
      0x9d: { 0: 'XH', 1: 'IXH' },
      0x9e: { 0: 'XL', 1: 'IXL' },
      0x9f: { 0: 'YH', 1: 'IYH' },
      0xa0: { 0: 'YL', 1: 'IYL' },
      0x99: { 0: 'Z' },
    },
  };
}
