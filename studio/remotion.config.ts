import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
// Software WebGL: 3D reels (@remotion/three) render the same on any machine, GPU or not.
Config.setChromiumOpenGlRenderer("swangle");
