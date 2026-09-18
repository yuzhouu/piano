export const instruments = [
  { id: 'piano', label: '钢琴', subtitle: '温暖、明亮的原声钢琴', file: '0000_GeneralUserGS_sf2_file', gm: 0 },
  { id: 'music-box', label: '音乐盒', subtitle: '像藏在小盒子里的星星', file: '0100_GeneralUserGS_sf2_file', gm: 10 },
  { id: 'xylophone', label: '木琴', subtitle: '叮叮咚咚，跳跃的木头音符', file: '0130_GeneralUserGS_sf2_file', gm: 13 },
  { id: 'guitar', label: '吉他', subtitle: '轻轻拨动一根温柔的琴弦', file: '0240_GeneralUserGS_sf2_file', gm: 24 },
] as const
export type InstrumentId = (typeof instruments)[number]['id']
export type Instrument = (typeof instruments)[number]
export const getInstrument = (id: InstrumentId) => instruments.find((item) => item.id === id)!
