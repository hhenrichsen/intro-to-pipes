import { makeProject } from "@motion-canvas/core";
import ffmpeg from "@motion-canvas/ffmpeg";

import example from "./scenes/example?scene";

export default makeProject({
  scenes: [example],
});
