---
title: Public claims registry - Flisk CLI
description: "The public claims registry for Flisk CLI: each number on this site, the evidence behind it and its limits, kept in the Flisk repository."
layout: default
---

<div class="aw">
  <section class="aw-section" style="padding-top: 10rem;">
    <div class="aw-wrap aw-docs">
      {% include docs-sidebar.html %}

      <article class="aw-docs-body">
        <h1>Public claims registry</h1>
        <p class="aw-lead">The canonical claim wording, evidence, and limits are maintained in the <a href="https://github.com/flisk-sh/flisk/blob/main/docs/claims.md">Flisk CLI repository</a>. Public site numbers link here so readers can inspect the source and caveats.</p>

        <p>Flisk CLI turns a <code>service.json</code> per service into a local Docker stack, with Tilt (the local development tool) watching services and live-updating containers as you code. It is not a deploy tool and not a Compose replacement. Production stays on Helm.</p>

        <h2 id="compose-import">Compose import</h2>

        <blockquote><p>A plain Compose app (a Node API and Postgres) answered 49 s after <code>flisk import</code> on a clean Ubuntu CI runner, images pulled and built from scratch, install not counted (<a href="https://github.com/flisk-sh/flisk/actions/runs/40660606705">run</a>).</p></blockquote>

        <p>One cold run of the <code>compose-import</code> journey (case CI3) on 2026-10-28. CI repeats it on every pull request to the Flisk CLI. A larger app takes longer.</p>

        <h2 id="homepage-terminal">Homepage terminal</h2>

        <p>The terminal in the homepage hero replays real output from Flisk CLI {{ site.data.flisk.terminal_capture_version }}, shortened and replayed faster than it ran. One run of each scene on an Apple Silicon Mac on 2026-11-09, on a working Docker setup and not a clean machine.</p>

        <p>Demo scene: the local-process demo (<code>flisk demo --no-docker</code>) reported both services ready in 0.8 s, with the package already downloaded. Its site is on port 3001 because 3000 was taken; the screenshot is the page it opened. This demo starts plain <code>node</code> processes and does not reload on save.</p>

        <p>Save scene: <code>flisk import</code> and <code>flisk up</code> on a one-service Node app in Docker Compose, then one changed string in its source file. The new response came back {{ site.data.flisk.save_update }} after the save. A larger app, or a change to its dependencies, takes longer.</p>

        <h2 id="agent-run">Agent run</h2>

        <p>The Start, Check and Fix section on the homepage quotes one run on 2026-11-09, on a two-service app as plain local processes, using only the MCP tools. <code>doctor</code> passed, <code>up</code> started both services, <code>status</code> showed both unhealthy, and <code>logs</code> named the cause (<code>DATABASE_URL is not set</code>). The code was fixed, <code>down</code> and <code>up</code> restarted the stack, and <code>status</code> showed both ready and answering.</p>

        <p>In this mode restarting a single service is not available, so the agent stopped and started the whole stack. Restarting one service needs Docker and Tilt.</p>

        <h2 id="console">Homepage console</h2>

        <p>The console in the homepage hero is the FliskOS interface itself, copied unchanged from <a href="https://github.com/flisk-sh/fliskos">flisk-sh/fliskos</a> (version 0.2.0). On the homepage it reads sample data in place of a local server, so nothing starts on your machine and nothing leaves your browser. Creating projects, running tools and starting agent threads are switched off there.</p>

        <p>The sample data was captured on 2026-11-09 from FliskOS and Flisk CLI {{ site.data.flisk.terminal_capture_version }} running two small projects as plain local processes: the two-service demo app, and a two-service app with <code>DATABASE_URL</code> left unset. The doctor results, the log line and the agent thread are real output. We edited four things: folder paths and the user name are replaced, both projects are shown as running with separate platform ports, the agent thread is shortened to the steps about this project, and Start, Stop, Restart and "Apply the fix" switch between the captured states instead of running anything.</p>

        <p>The agent thread is one read-only Claude Code run started from FliskOS, asked why the api service was not healthy. It found the cause and proposed a fix. The fix the homepage applies is the one-line change we made by hand.</p>

        <h2 id="fix-a-bug">Fix a bug scene</h2>

        <p>The Fix a bug tab in the homepage terminal replays one run of Flisk CLI {{ site.data.flisk.terminal_capture_version }} on 2026-11-09, on a two-service app as plain local processes, with <code>DATABASE_URL</code> deliberately left unset. The output is shortened to the lines shown. The commands were run in a terminal and the one-line fix was made by hand, not by an agent. This scene shows what the CLI reports; the agent run above is the one that used the MCP tools.</p>

        <h2>14-service demo</h2>

        <blockquote><p>14 tiny services healthy in 4.6s on a 16 GB M1 after images existed. Not a cold boot.</p></blockquote>

        <h2>100-service bench</h2>

        <blockquote><p>100 generated <code>/health</code> stubs, ~20 lines each, healthy through Traefik in 472s on a clean Ubuntu runner (<a href="https://github.com/flisk-sh/flisk/actions/runs/36395860088">run</a>). Not an ERP.</p></blockquote>

        <h2 id="benchmark-panel">Homepage benchmark panel</h2>

        <p>The chart panel in the homepage hero shows single benchmark runs copied from result files in the Flisk CLI repository. They are not comparable with the 100-service bench above: a different machine and setup, and services from the <code>flisk-erp-system</code> example repository (tiny services) instead of generated stubs on a clean CI runner. Not an ERP.</p>

        {% for b in site.data.benchmarks %}
        <h3>{{ b.tab }}: {{ b.title }}</h3>
        <p>{{ b.subtitle }}.
          {% for r in b.rows %}{% if r.name %}{{ r.name }}{% else %}{{ r.label }} {{ b.row_suffix }}{% endif %}: {{ r.display }}{% unless forloop.last %} · {% endunless %}{% endfor %}.</p>
        <p>Headline stats: {% for st in b.stats %}{{ st.value }} {{ st.label }}{% unless forloop.last %} · {% endunless %}{% endfor %}.</p>
        <p>Conditions: {{ b.note }}. Source: <a href="https://github.com/flisk-sh/flisk/blob/main/{{ b.source }}"><code>{{ b.source }}</code></a>.</p>
        {% endfor %}

        <h2>Onboarding</h2>

        <p>Designed so <code>flisk doctor</code> and <code>flisk up</code> replace a setup wiki. Not measured on a hiring cohort.</p>

        <h2>ROI calculator</h2>

        <p>Inputs are user-set. Output is arithmetic, not savings.</p>
      </article>
    </div>
  </section>
</div>
