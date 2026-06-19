// Camera rig shared by render.mjs (renders + derives H) and verify.mjs (checks H).
// Keeping it in one place stops the two scripts from drifting apart.
//
// Image sizes match the on-screen panel aspects so the frontend can use
// objectFit:"fill" without distortion: the demo cell is ~0.976 wide:tall on
// desktop, split into a top camera row (~42% height) + a full-width top-down
// (~58%). Oblique panel ≈ (0.976/2)/0.42 ≈ 1.16; top-down ≈ 0.976/0.58 ≈ 1.68.
export const CAMERAS = [
  { id: "cam_a", label: "CAM A", file: "cam-a", kind: "persp", width: 800, height: 690,
    pos: [-16, 12, -14], target: [2, 0, 2], fov: 60 },
  { id: "cam_b", label: "CAM B", file: "cam-b", kind: "persp", width: 800, height: 690,
    pos: [17, 11, 13], target: [-2, 0, -1], fov: 60 },
  { id: "topdown", label: "2D · WORLD PLANE", file: "topdown", kind: "ortho", width: 1280, height: 762,
    pos: [0, 40, 0], target: [0, 0, 0], orthoHalfW: 16.6, orthoHalfH: 9.88 },
];
