/**
 * Remotion registry: every in-game cinematic as a standalone composition, so the sequences
 * can be previewed in Remotion Studio (`npm run remotion:studio`) and rendered to video.
 */
import { Composition, Folder } from 'remotion';
import { COMPOSITIONS, DEFAULT_DURATIONS } from '../src/cinematics/compositions';
import type { CinematicId } from '../src/game/types';

const PROPS: Partial<Record<CinematicId, Record<string, unknown>>> = {
  title: { small: 'ARCGX TECHLABS PRESENTS', big: 'The Night Before the Lights' },
  chapter: { small: 'CHAPTER 1', big: 'The ride of Garuda' },
  banner: { text: 'Satyabhama takes the bow', accent: true },
  victory: { text: 'Narakasura falls' },
  finale: { name: 'Suneel' },
};
export const RemotionRoot = () => (
  <>
    <Folder name="Cinematics">
      {(Object.keys(COMPOSITIONS) as CinematicId[]).map((id) => (
        <Composition key={id} id={id} component={COMPOSITIONS[id]} durationInFrames={DEFAULT_DURATIONS[id]} fps={30} width={1920} height={1080} defaultProps={PROPS[id] || {}} />
      ))}
    </Folder>
  </>
);
