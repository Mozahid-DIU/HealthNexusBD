import { Composition } from 'remotion'
import { Pitch } from './Pitch'
import { FPS, TOTAL_SECONDS } from './theme'
import { Thumbnail } from './Thumbnail'

export const Root = () => (
  <>
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={1280} height={720} />
    <Composition id="Pitch" component={Pitch} durationInFrames={Math.round(TOTAL_SECONDS * FPS)} fps={FPS} width={1920} height={1080} />
  </>
)
