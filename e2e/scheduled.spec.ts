import { apiJson, createGroup, cronTick, email, expect, joinApi, newPerson, readOutbox, test, utcLocalIn, waitForEmail } from "./helpers";
import type { OrganizerDashboardDTO, ParticipantHomeDTO } from "../src/lib/contracts";

test.describe("E: scheduled drawing", () => {
  test("the cron tick draws at the scheduled time and queues assignment emails without recipient names", async ({ context, browser }) => {
    test.setTimeout(240_000);
    const drawAt = utcLocalIn(1); // 1–2 minutes from now (the API refuses past times)
    const group = await createGroup(context, { name: "Riverside Neighbours", drawMethod: "scheduled", drawAt });
    const people = [
      { name: "Wendell Okafor", email: email("wendell") },
      { name: "Xiomara Lind", email: email("xiomara") },
      { name: "Yusuf Brandt", email: email("yusuf") },
    ];
    const joined = [];
    for (const p of people) {
      const person = await newPerson(browser);
      const res = await joinApi(person.context.request, group.inviteCode, p.name, p.email);
      joined.push({ ...p, ...res, request: person.context.request });
    }

    // Before the time, a tick doesn't draw.
    await cronTick(context.request);
    const before = await apiJson<OrganizerDashboardDTO>(context.request, "GET", `/api/o/${group.groupId}`);
    expect(before.group.status).toBe("open");
    expect(before.group.drawMethod).toBe("scheduled");

    // Once draw_at passes, the next tick draws (poll the tick like the scheduler would).
    await expect
      .poll(
        async () => {
          await cronTick(context.request);
          return (await apiJson<OrganizerDashboardDTO>(context.request, "GET", `/api/o/${group.groupId}`)).group.status;
        },
        { timeout: 200_000, intervals: [5_000] },
      )
      .toBe("drawn");

    // Every participant has an assignment and got an assignment email that names nobody.
    const names = people.map((p) => p.name);
    for (const p of joined) {
      const home = await apiJson<ParticipantHomeDTO>(p.request, "GET", `/api/p/${p.participantId}`);
      expect(home.assignment.state).toBe("ready");
      const mail = await waitForEmail(context.request, p.email, /picked your Secret Santa recipient/);
      for (const n of names) {
        expect(mail.text).not.toContain(n);
        expect(mail.html).not.toContain(n);
        expect(mail.subject).not.toContain(n);
      }
    }
    const assignmentMails = (await readOutbox(context.request)).filter((e) => /picked your Secret Santa recipient/.test(e.subject));
    expect(new Set(assignmentMails.filter((m) => people.some((p) => p.email === m.to)).map((m) => m.to)).size).toBe(3);
  });
});
