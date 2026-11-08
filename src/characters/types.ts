/** Props shared by all character components. */
export interface CharacterProps {
  /** 'game' reads sim/store each frame. 'portrait' is a calm bust for the dialogue avatar. 'showcase' plays the named state on a turntable. */
  mode?: 'game' | 'portrait' | 'showcase';
  /** Showcase state name (see each character for the list). */
  state?: string;
  /** Showcase parameter 0..1 (bow draw, swing progress, dissolve...). */
  param?: number;
}
