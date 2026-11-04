// Cactus Echo Lab: shared session metrics.
// Used by the main app (live stats + summary CSV) and the report page, so both always agree.
(function (g) {
  'use strict';
  const r1 = v => (v === undefined || v === null || isNaN(v)) ? '' : Math.round(v * 10) / 10;
  const r0 = v => (v === undefined || v === null || isNaN(v)) ? '' : Math.round(v);
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const SHAPES = ['rising', 'falling', 'rise-fall', 'fall-rise', 'flat', 'level', 'unvoiced'];

  function agg(vocs, reps, activeMs) {
    const answered = reps.filter(r => r.answered);
    let chain = 0, longest = 0;
    for (const v of vocs) { chain = (v.follows_reply || v.barge_in) ? chain + 1 : 0; longest = Math.max(longest, chain); }
    const out = {
      active_min: Math.round(activeMs / 600) / 100,
      vocalizations: vocs.length,
      voc_per_min: activeMs > 0 ? Math.round(vocs.length / (activeMs / 60000) * 100) / 100 : '',
      replies: reps.length,
      auto_replies: reps.filter(r => r.trigger === 'auto').length,
      manual_replies: reps.filter(r => r.trigger === 'manual').length,
      stopped_replies: reps.filter(r => r.stopped).length,
      answered_replies: answered.length,
      response_rate: reps.length ? Math.round(answered.length / reps.length * 1000) / 1000 : '',
      contingent_vocs: vocs.filter(v => v.follows_reply).length,
      interrupted_replies: reps.filter(r => r.interrupted).length,
      barge_in_vocs: vocs.filter(v => v.barge_in).length,
      longest_turn_chain: longest,
      mean_baby_latency_ms: r0(mean(answered.map(r => +r.baby_latency_ms))),
      mean_toy_delay_ms: r0(mean(reps.map(r => +r.response_delay_ms))),
      mean_voc_duration_ms: r0(mean(vocs.map(v => +v.duration_ms))),
      total_voc_time_s: r1(vocs.reduce((a, v) => a + (+v.duration_ms || 0), 0) / 1000),
      mean_voc_f0_hz: r0(mean(vocs.map(v => +v.f0_mean_hz).filter(x => x > 0))),
      mean_voc_f0_range_st: r1(mean(vocs.map(v => v.f0_range_st).filter(x => x !== '').map(Number))),
      mean_reply_f0_hz: r0(mean(reps.map(r => +r.out_f0_mean_hz).filter(x => x > 0)))
    };
    for (const s of SHAPES) out['shape_' + s.replace('-', '_')] = vocs.filter(v => v.contour_shape === s).length;
    return out;
  }

  // opts: boutGap (ms), activeMs, endWall, condTime: override the stored values for a live session
  function summarizeSession(s, opts = {}) {
    const ev = s.events, vocs = ev.filter(e => e.type === 'vocalization'), reps = ev.filter(e => e.type === 'reply');
    const activeMs = opts.activeMs ?? s.activeMs;
    const endWall = opts.endWall ?? s.endWall ?? Date.now();
    const gap = opts.boutGap ?? 10000;
    const bouts = engagementBouts(vocs, gap);
    const overall = Object.assign({ group: 'overall' }, agg(vocs, reps, activeMs), {
      total_duration_s: r1((endWall - s.startWall) / 1000), paused_s: r1(Math.max(0, (endWall - s.startWall) - activeMs) / 1000),
      bouts: bouts.length, mean_bout_s: r1(mean(bouts.map(b => (b.end - b.start) / 1000))), longest_bout_s: r1(Math.max(0, ...bouts.map(b => (b.end - b.start) / 1000))),
      first_voc_s: vocs.length ? r1(vocs[0].start_ms / 1000) : '', last_voc_s: vocs.length ? r1(vocs[vocs.length - 1].start_ms / 1000) : '',
      condition_switches: ev.filter(e => e.type === 'condition_change').length,
      settings_changes: ev.filter(e => e.type === 'settings_change').length, markers: ev.filter(e => e.type === 'marker').length,
      bout_gap_ms: gap
    });
    const condTime = opts.condTime ?? s.condTime ?? {};
    const keys = [...new Set([...Object.keys(condTime), ...vocs.map(v => v.cond_key), ...reps.map(r => r.cond_key)])];
    const rows = [overall];
    for (const k of keys) rows.push(Object.assign({ group: k }, agg(vocs.filter(v => v.cond_key === k), reps.filter(r => r.cond_key === k), condTime[k] || 0)));
    return rows;
  }

  function engagementBouts(vocs, gap) {
    const bouts = [];
    for (const v of vocs) {
      const last = bouts[bouts.length - 1];
      if (last && v.start_ms - last.end <= gap) { last.end = Math.max(last.end, v.end_ms); last.n++; }
      else bouts.push({ start: v.start_ms, end: v.end_ms, n: 1 });
    }
    return bouts;
  }

  g.CactusMetrics = { agg, summarizeSession, engagementBouts, SHAPES, mean, r0, r1 };
})(window);
