(() => {
  "use strict";

  function initialize() {
    const $ = (id) => document.getElementById(id);
    const tabs = [...document.querySelectorAll("[data-course-tab]")];
    const panels = [...document.querySelectorAll("[data-course-panel]")];
    const scenes = [...document.querySelectorAll("[data-course-scene]")];
    const sensors = [...document.querySelectorAll("[data-sensor]")];
    const worlds = [...document.querySelectorAll("[data-world]")];
    const ambient = [...document.querySelectorAll("video[data-ambient]")];
    const dialog = $("story-film-dialog");
    const film = $("story-film");
    const opener = $("open-story-film");
    const heroAtmosphere = $("atmosphere");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visible = new Map();
    let returnFocus = null;
    let restoreHero = false;

    function selectChapter(key, focus = false) {
      const selected = tabs.find((tab) => tab.dataset.courseTab === key);
      if (!selected) return;
      tabs.forEach((tab) => {
        const active = tab === selected;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle("is-active", active);
      });
      panels.forEach((panel) => {
        const active = panel.dataset.coursePanel === key;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
      scenes.forEach((scene) => {
        const active = scene.dataset.courseScene === key;
        scene.hidden = !active;
        scene.classList.toggle("is-active", active);
      });
      if (focus) selected.focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectChapter(tab.dataset.courseTab));
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectChapter(tabs[next].dataset.courseTab, true);
      });
    });
    selectChapter(
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset
        .courseTab || "data",
    );

    const readings = {
      A: [2, 3, 4],
      B: [20, 18, 16],
      C: [5, 7, 6],
      D: [8, 8, 9],
    };

    function selectSensor(key) {
      const values = readings[key];
      if (!values) return;
      sensors.forEach((button) => {
        const active = button.dataset.sensor === key;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      });
      const points = values.map((value, index) => [
        40 + index * 140,
        178 - (value / 22) * 138,
      ]);
      $("sensor-line")?.setAttribute(
        "points",
        points.map((point) => point.join(",")).join(" "),
      );
      document.querySelectorAll("[data-sensor-point]").forEach((circle) => {
        const point = points[Number(circle.dataset.sensorPoint)];
        if (!point) return;
        circle.setAttribute("cx", String(point[0]));
        circle.setAttribute("cy", String(point[1]));
      });
      if ($("sensor-values"))
        $("sensor-values").textContent = values.join(", ");
      if ($("sensor-name")) $("sensor-name").textContent = key;
    }

    sensors.forEach((button) =>
      button.addEventListener("click", () =>
        selectSensor(button.dataset.sensor),
      ),
    );
    selectSensor(
      sensors.find((button) => button.getAttribute("aria-pressed") === "true")
        ?.dataset.sensor || "A",
    );

    const worldDetails = {
      "deep-orbit": {
        name: "Deep Orbit",
        topic: "Time-Series & Signals",
        description:
          "Help the Archimedes crew investigate an unexplained signal by building DEEP SCAN, a signal classifier.",
      },
      "neon-protocol": {
        name: "Neon Protocol",
        topic: "Real-Time Computer Vision",
        description:
          "Help restore a city's camera system with Protocol Sentinel, an urban anomaly detector.",
      },
      "signal-ward": {
        name: "Signal Ward",
        topic: "NLP & Text Intelligence",
        description:
          "Help a hospital team make sense of clinical notes with Diagnostic One, a clinical text assistant.",
      },
      "nova-canvas": {
        name: "Nova Canvas",
        topic: "Multimodal & Generative AI",
        description:
          "Help a studio build a multimodal creative assistant for its next exhibition.",
      },
      "terra-grid": {
        name: "Terra Grid",
        topic: "Edge AI & Production ML",
        description:
          "Build an edge monitoring system and investigate why models fail in the field.",
      },
    };

    function selectWorld(key) {
      const detail = worldDetails[key];
      if (!detail) return;
      const available = key === "deep-orbit";
      worlds.forEach((button) => {
        const active = button.dataset.world === key;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      });
      ["name", "topic", "description"].forEach((field) => {
        if ($(`world-${field}`))
          $(`world-${field}`).textContent = detail[field];
      });
      if ($("world-status"))
        $("world-status").textContent = available
          ? "Available now"
          : "Coming soon";
      if ($("world-start")) $("world-start").hidden = !available;
    }

    worlds.forEach((button) =>
      button.addEventListener("click", () => selectWorld(button.dataset.world)),
    );
    selectWorld(
      worlds.find((button) => button.getAttribute("aria-pressed") === "true")
        ?.dataset.world || "deep-orbit",
    );

    function inViewport(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      );
    }

    function motionAllowed() {
      return (
        !document.hidden &&
        !reduced.matches &&
        !document.body.classList.contains("motion-paused")
      );
    }

    function mayPlay(video) {
      return motionAllowed() && !dialog?.open && visible.get(video);
    }

    function play(video, allowed) {
      try {
        const pending = video.play();
        if (pending?.then)
          pending
            .then(() => {
              if (!allowed()) video.pause();
            })
            .catch(() => {});
      } catch (_) {
        // The poster remains visible if the browser declines playback.
      }
    }

    function syncAmbient() {
      ambient.forEach((video) => {
        if (mayPlay(video)) {
          if (video.paused) play(video, () => mayPlay(video));
        } else video.pause();
      });
      if (dialog?.open) heroAtmosphere?.pause();
    }

    ambient.forEach((video) => {
      visible.set(video, inViewport(video));
      video.addEventListener("play", () => {
        if (!mayPlay(video)) video.pause();
      });
    });
    if (window.IntersectionObserver) {
      // A video counts as visible from 1% of its area, and the observer
      // fires at exactly that ratio, so every change produces a callback.
      // With the default threshold, a section that starts at the viewport
      // edge reports ratio 0 at load and never reports again, and a smooth
      // scroll back to the top can stop inside the 0 to 1% band.
      const VISIBLE_RATIO = 0.01;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible.set(
              entry.target,
              entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO,
            );
          });
          syncAmbient();
        },
        { threshold: [0, VISIBLE_RATIO] },
      );
      ambient.forEach((video) => observer.observe(video));
    } else {
      let scheduled = false;
      const updateVisibility = () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(() => {
          scheduled = false;
          ambient.forEach((video) => visible.set(video, inViewport(video)));
          syncAmbient();
        });
      };
      window.addEventListener("scroll", updateVisibility, { passive: true });
      window.addEventListener("resize", updateVisibility);
    }
    document.addEventListener("visibilitychange", syncAmbient);
    if (reduced.addEventListener)
      reduced.addEventListener("change", syncAmbient);
    else if (reduced.addListener) reduced.addListener(syncAmbient);
    if (window.MutationObserver)
      new MutationObserver(syncAmbient).observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });

    function finishFilm() {
      film?.pause();
      syncAmbient();
      if (
        restoreHero &&
        heroAtmosphere &&
        motionAllowed() &&
        inViewport(heroAtmosphere)
      )
        play(heroAtmosphere, () => motionAllowed() && !dialog?.open);
      restoreHero = false;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }

    function closeFilm() {
      film?.pause();
      if (!dialog?.open) return;
      if (typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        finishFilm();
      }
    }

    opener?.addEventListener("click", () => {
      if (!dialog || dialog.open) return;
      returnFocus = document.activeElement;
      restoreHero = Boolean(heroAtmosphere && !heroAtmosphere.paused);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {
        dialog.setAttribute("open", "");
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        $("close-story-film")?.focus();
      }
      syncAmbient();
      if (film) play(film, () => Boolean(dialog.open));
    });
    $("close-story-film")?.addEventListener("click", closeFilm);
    dialog?.addEventListener("close", finishFilm);
    dialog?.addEventListener("cancel", () => film?.pause());
    dialog?.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        closeFilm();
    });
    heroAtmosphere?.addEventListener("play", () => {
      if (dialog?.open) heroAtmosphere.pause();
    });
    syncAmbient();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
