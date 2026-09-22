import { initStore, storeInfo } from "./server/race/db.js";
import { resolveSubjectId, saveRun, newRunId, hashEmail, listRuns, getRun } from "./server/race/store.js";
(async () => {
  const r = await initStore();
  console.log("initStore ->", r);
  const sid = await resolveSubjectId("demo@thriwe.com");
  const runId = newRunId();
  await saveRun({ runId, subjectId: sid, emailHash: hashEmail("demo@thriwe.com"),
    useCase: "customer_insight", startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(), status: "completed",
    vendorsCalled: [{ vendor: "osint_industries", ok: true, itemCount: 12 }],
    costINR: 62.54, steps: [], summary: { platformCount: 12 } } as any);
  console.log("subject:", sid, "run:", runId);
  console.log("listRuns:", (await listRuns(5)).length, "getRun ok:", !!(await getRun(runId)));
  console.log("storeInfo:", storeInfo());
  setTimeout(() => { console.log("still alive after late rejections — good"); process.exit(0); }, 6000);
})();
