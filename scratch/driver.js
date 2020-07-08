import { promises } from 'fs';
import { Unpack } from '@remy/unpack';
const { readFile } = promises;

async function main() {
  const file = await readFile(__dirname + '/../tmp/nextdaw.drv');
  const unpack = new Unpack(file);

  const { id, interrupt, relocs, mmcbanks } = unpack.parse(`<A4$sig
  b7$id
  b$interrupt
  C$relocs
  C$mmcbanks`);

  const { zxbanks, driver, relocs2 } = unpack.parse(`< C$zxbanks
  C512$driver C${relocs * 2}$relocs2`);

  console.log({ mmcbanks, relocs, offset: unpack.offset });

  for (let i = 0; i < mmcbanks; i++) {
    const { patches, size } = unpack.parse(`<C$patches S$size`);
    console.log({ patches, size });

    const { data, patches2 } = unpack.parse(
      `<C${size}$data C${patches * 2}$patches2`
    );
  }
}

main().catch((err) => console.log(err));
