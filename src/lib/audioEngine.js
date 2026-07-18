// PLACEHOLDER — real synthesis/decoded-cue implementation is being built
// separately (see the audio-engine handoff prompt) and will replace this
// file's internals. The exported API below is the locked contract every
// caller in this app (useTimerEngine) is written against, so swapping the
// real implementation in requires no changes anywhere else.
//
// Cue mapping (final, reconciled):
//   playIntroChime     — programme start (real bell MP3)
//   playCountdownTick  — one tick; caller schedules repeats (real MP3)
//   playStartActivity  — start of every activity (synthesized whistle)
//   playEndActivity    — end of an activity (real ship-bell MP3)
//   playEndBlock       — end of a block (real gong MP3)
//   playEndProgramme   — end of the programme (real gong MP3, same sound)

/* eslint-disable no-unused-vars -- placeholder params mirror the real API */

export function bootAudioContext() {
  console.warn('[audioEngine] placeholder: bootAudioContext() — real implementation pending')
}

export function resumeAudioContext() {
  // no-op placeholder
}

export function setVolume(v) {
  // no-op placeholder
}

export function getVolume() {
  return 80
}

export function playIntroChime(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playIntroChime')
}

export function playCountdownTick(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playCountdownTick')
}

export function playStartActivity(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playStartActivity')
}

export function playEndActivity(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playEndActivity')
}

export function playEndBlock(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playEndBlock')
}

export function playEndProgramme(t0 = 0) {
  console.warn('[audioEngine] placeholder cue: playEndProgramme')
}
