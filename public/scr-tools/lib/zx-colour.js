export const brightColoursLookup = new Map();
brightColoursLookup.set([0, 0, 0].toString(), 0b000);
brightColoursLookup.set([0, 0, 0xff].toString(), 0b001);
brightColoursLookup.set([0xff, 0, 0].toString(), 0b010);
brightColoursLookup.set([0xff, 0, 0xff].toString(), 0b011);
brightColoursLookup.set([0, 0xff, 0].toString(), 0b100);
brightColoursLookup.set([0, 0xff, 0xff].toString(), 0b101);
brightColoursLookup.set([0xff, 0xff, 0].toString(), 0b110);
brightColoursLookup.set([0xff, 0xff, 0xff].toString(), 0b111);

export const normalColoursLookup = new Map();
normalColoursLookup.set([0, 0, 0].toString(), 0b000);
normalColoursLookup.set([0, 0, 0xd7].toString(), 0b001);
normalColoursLookup.set([0xd7, 0, 0].toString(), 0b010);
normalColoursLookup.set([0xd7, 0, 0xd7].toString(), 0b011);
normalColoursLookup.set([0, 0xd7, 0].toString(), 0b100);
normalColoursLookup.set([0, 0xd7, 0xd7].toString(), 0b101);
normalColoursLookup.set([0xd7, 0xd7, 0].toString(), 0b110);
normalColoursLookup.set([0xd7, 0xd7, 0xd7].toString(), 0b111);

export const brightColours = {
  0b000: [0, 0, 0],
  0b001: [0, 0, 0xff],
  0b010: [0xff, 0, 0],
  0b011: [0xff, 0, 0xff],
  0b100: [0, 0xff, 0],
  0b101: [0, 0xff, 0xff],
  0b110: [0xff, 0xff, 0],
  0b111: [0xff, 0xff, 0xff],
};

export const normalColours = {
  0b000: [0, 0, 0],
  0b001: [0, 0, 0xd7],
  0b010: [0xd7, 0, 0],
  0b011: [0xd7, 0, 0xd7],
  0b100: [0, 0xd7, 0],
  0b101: [0, 0xd7, 0xd7],
  0b110: [0xd7, 0xd7, 0],
  0b111: [0xd7, 0xd7, 0xd7],
};
