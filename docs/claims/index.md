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
