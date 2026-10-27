/*
 * GameRAX SEO + shareable category URLs
 * Load this file AFTER the main inline GameRAX script.
 * Does not delete database records or Supabase policies.
 */
(function () {
  "use strict";

  var ORIGIN = "https://gamerax.online";
  var HOME_TITLE = "GameRAX - Free Online Games";
  var HOME_DESCRIPTION = "Play free online games on GameRAX. Discover racing, action, multiplayer, shooting, strategy, sports and casual browser games and start playing instantly.";
  var DEFAULT_CATEGORIES = ["Action", "Adventure", "Arcade", "Board", "Casual", "Driving", "Dress Up", "Multiplayer", "Puzzle", "Racing", "Shooting", "Sports", "Strategy", "Simulation", "Tycoon"];

  function slug(value) {
    return String(value || "game")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "game";
  }

  function gamePath(game) {
    return "/game/" + slug(
      (game && (
        game.seoSlug ||
        game.seo_slug ||
        game.name ||
        game.title
      )) || "game"
    );
  }

  function categoryPath(category) {
    return "/category/" + slug(category || "games");
  }

  function setMeta(selector, key, keyValue, attr, value) {
    var el = document.querySelector(selector);

    if (!el) {
      el = document.createElement(key);
      var match = selector.match(
        /\[(?:name|property)=["']([^"']+)["']\]/
      );

      if (match) {
        el.setAttribute(keyValue, match[1]);
      }

      document.head.appendChild(el);
    }

    el.setAttribute(attr, value);
  }

  function setSEO(title, description, path) {
    var cleanTitle = String(title || HOME_TITLE)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);

    var cleanDescription = String(
      description || HOME_DESCRIPTION
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    var url = ORIGIN + (path || "/");

    document.title = cleanTitle;

    setMeta(
      'meta[name="description"]',
      "meta",
      "name",
      "content",
      cleanDescription
    );

    setMeta(
      'meta[property="og:title"]',
      "meta",
      "property",
      "content",
      cleanTitle
    );

    setMeta(
      'meta[property="og:description"]',
      "meta",
      "property",
      "content",
      cleanDescription
    );

    setMeta(
      'meta[property="og:url"]',
      "meta",
      "property",
      "content",
      url
    );

    setMeta(
      'meta[name="twitter:title"]',
      "meta",
      "name",
      "content",
      cleanTitle
    );

    setMeta(
      'meta[name="twitter:description"]',
      "meta",
      "name",
      "content",
      cleanDescription
    );

    var canonical = document.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = url;
  }

  function setGameStructuredData(game) {
    if (!game) return;

    var schema = {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      "name": game.name || "Game",
      "description": game.seoDescription ||
        game.description ||
        ("Play " + (game.name || "this game") +
          " online for free on GameRAX."),
      "url": ORIGIN + gamePath(game),
      "genre": game.category || "Online Games",
      "gamePlatform": "Web browser"
    };

    if (game.iconImage) {
      schema.image = game.iconImage;
    }

    var script = document.getElementById(
      "gameraxCurrentGameJsonLd"
    );

    if (!script) {
      script = document.createElement("script");
      script.id = "gameraxCurrentGameJsonLd";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
  }

  function categoryList(games) {
    var values = DEFAULT_CATEGORIES.slice();

    (games || []).forEach(function (game) {
      var value = String(
        (game && game.category) || ""
      ).trim();

      if (
        value &&
        !values.some(function (existing) {
          return existing.toLowerCase() ===
            value.toLowerCase();
        })
      ) {
        values.push(value);
      }
    });

    return values.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function addCategoryRouteLinks() {
    if (
      typeof window.renderSidebarCategories !==
      "function"
    ) return;

    var original = window.renderSidebarCategories;

    if (original.__gameraxSeoWrapped) return;

    var wrapped = function (games) {
      var result = original.apply(this, arguments);
      var wrap = document.getElementById(
        "sidebarCategories"
      );

      if (!wrap) return result;

      Array.prototype.slice.call(
        wrap.querySelectorAll("button.side-category")
      ).forEach(function (button) {
        var label = button.querySelector(".side-text");

        var category = label
          ? label.textContent.trim()
          : button.textContent.trim();

        var anchor = document.createElement("a");

        anchor.className = button.className;
        anchor.innerHTML = button.innerHTML;
        anchor.style.textDecoration = "none";
        anchor.style.color = "inherit";

        anchor.href =
          category.toLowerCase() === "all categories"
            ? "/"
            : categoryPath(category);

        anchor.addEventListener("click", function (event) {
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          ) return;

          event.preventDefault();

          if (category.toLowerCase() === "all categories") {
            window.filterCategory("All");
          } else {
            window.filterCategory(category);
          }
        });

        button.replaceWith(anchor);
      });

      return result;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.renderSidebarCategories = wrapped;
  }

  function addGameCardLinks() {
    if (typeof window.renderAllGrid !== "function") {
      return;
    }

    var original = window.renderAllGrid;

    if (original.__gameraxSeoWrapped) return;

    var wrapped = function (games) {
      var result = original.apply(this, arguments);
      var grid = document.getElementById("gameGrid");

      if (!grid) return result;

      Array.prototype.slice.call(
        grid.querySelectorAll(".game-card")
      ).forEach(function (card) {
        var heading = card.querySelector("h3");

        var title = heading
          ? heading.textContent.trim()
          : "";

        var game = (games || []).find(function (item) {
          return String(item.name || "").trim() === title;
        });

        if (!game) return;

        var anchor = document.createElement("a");

        anchor.className = card.className;
        anchor.href = gamePath(game);
        anchor.style.textDecoration = "none";
        anchor.style.color = "inherit";
        anchor.innerHTML = card.innerHTML;

        anchor.addEventListener("click", function (event) {
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          ) return;

          event.preventDefault();
          window.openGamePlayer(game);
        });

        card.replaceWith(anchor);
      });

      return result;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.renderAllGrid = wrapped;
  }

  function addMiniCardLinks() {
    if (
      typeof window.createMiniCard !== "function" ||
      window.createMiniCard.__gameraxSeoWrapped
    ) return;

    var original = window.createMiniCard;

    var wrapped = function (game, index) {
      var card = original.apply(this, arguments);

      if (!game || !card) return card;

      var anchor = document.createElement("a");

      anchor.className = card.className || "mini-card";
      anchor.href = gamePath(game);
      anchor.style.textDecoration = "none";
      anchor.style.color = "inherit";
      anchor.innerHTML = card.innerHTML;

      anchor.addEventListener("click", function (event) {
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) return;

        event.preventDefault();
        window.openGamePlayer(game);
      });

      return anchor;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.createMiniCard = wrapped;
  }

  function mergeSEOFields(normalized, rawGames) {
    var rawById = new Map(
      (rawGames || []).map(function (game) {
        return [String(game.id), game];
      })
    );

    return (normalized || []).map(function (game) {
      var raw = rawById.get(String(game.id)) || {};
      var pickedTitle = String(
        game.name || raw.title || "Game"
      );

      return Object.assign({}, game, {
        seoSlug: raw.seo_slug ||
          raw.seoSlug ||
          game.seoSlug ||
          slug(pickedTitle),

        seoTitle: raw.seo_title ||
          raw.seoTitle ||
          game.seoTitle ||
          ("Play " + pickedTitle + " Online - GameRAX"),

        seoDescription: raw.seo_description ||
          raw.seoDescription ||
          game.seoDescription ||
          String(
            game.description ||
            ("Play " + pickedTitle +
              " online for free on GameRAX.")
          ).slice(0, 160)
      });
    });
  }

  function extendGameData() {
    if (
      typeof window.normalizeGames === "function" &&
      !window.normalizeGames.__gameraxSeoWrapped
    ) {
      var originalNormalize = window.normalizeGames;

      var normalized = function (games) {
        return mergeSEOFields(
          originalNormalize.apply(this, arguments),
          games
        );
      };

      normalized.__gameraxSeoWrapped = true;
      window.normalizeGames = normalized;
    }

    if (
      typeof window.getGamesFromSupabase === "function" &&
      !window.getGamesFromSupabase.__gameraxSeoWrapped
    ) {
      var originalGetGames = window.getGamesFromSupabase;

      var getGames = async function () {
        var games = await originalGetGames.apply(
          this,
          arguments
        );

        if (
          !games ||
          !games.length ||
          typeof supabaseClient === "undefined"
        ) {
          return mergeSEOFields(games, games);
        }

        try {
          var ids = games.map(function (game) {
            return game.id;
          }).filter(function (id) {
            return id !== undefined && id !== null;
          });

          if (!ids.length) {
            return mergeSEOFields(games, games);
          }

          var response = await supabaseClient
            .from("games")
            .select(
              "id,seo_slug,seo_title,seo_description"
            )
            .in("id", ids);

          if (response.error) throw response.error;

          var byId = new Map(
            (response.data || []).map(function (row) {
              return [String(row.id), row];
            })
          );

          return games.map(function (game) {
            var row = byId.get(String(game.id)) || {};
            var name = game.name || "Game";

            return Object.assign({}, game, {
              seoSlug: row.seo_slug ||
                game.seoSlug ||
                slug(name),

              seoTitle: row.seo_title ||
                game.seoTitle ||
                ("Play " + name + " Online - GameRAX"),

              seoDescription: row.seo_description ||
                game.seoDescription ||
                String(
                  game.description ||
                  ("Play " + name +
                    " online for free on GameRAX.")
                ).slice(0, 160)
            });
          });
        } catch (error) {
          console.warn(
            "GameRAX SEO fields could not be loaded; " +
            "using automatic defaults.",
            error
          );

          return mergeSEOFields(games, games);
        }
      };

      getGames.__gameraxSeoWrapped = true;
      window.getGamesFromSupabase = getGames;
    }
  }

  function routeMetadata(games) {
    var path = window.location.pathname;

    if (/^\/game\/[^/]+\/?$/i.test(path)) {
      var requested = decodeURIComponent(
        path.replace(/^\/game\//i, "").replace(/\/$/, "")
      ).toLowerCase();

      var game = (games || []).find(function (item) {
        return (
          slug(item.seoSlug || item.name) === requested ||
          slug(item.name) === requested
        );
      });

      if (game) {
        setSEO(
          game.seoTitle ||
            ("Play " + (game.name || "Game") +
              " Online - GameRAX"),
          game.seoDescription || game.description,
          gamePath(game)
        );

        setGameStructuredData(game);
        return;
      }
    }

    if (/^\/category\/[^/]+\/?$/i.test(path)) {
      var requestedCategory = decodeURIComponent(
        path.replace(/^\/category\//i, "").replace(/\/$/, "")
      ).toLowerCase();

      var category = categoryList(games).find(function (name) {
        return slug(name) === requestedCategory;
      });

      if (category) {
        setSEO(
          "Free " + category + " Games Online - GameRAX",
          "Play free " + category.toLowerCase() +
            " games online on GameRAX. Discover fun browser games and start playing instantly.",
          categoryPath(category)
        );

        var gameSchema = document.getElementById(
          "gameraxCurrentGameJsonLd"
        );

        if (gameSchema) gameSchema.remove();
        return;
      }
    }

    setSEO(HOME_TITLE, HOME_DESCRIPTION, "/");

    var oldSchema = document.getElementById(
      "gameraxCurrentGameJsonLd"
    );

    if (oldSchema) oldSchema.remove();
  }

  function addStructuredDataHook() {
    if (
      typeof window.updateGameRAXDirectoryStructuredData !==
        "function" ||
      window.updateGameRAXDirectoryStructuredData.__gameraxSeoWrapped
    ) return;

    var original =
      window.updateGameRAXDirectoryStructuredData;

    var wrapped = function (games) {
      var result = original.apply(this, arguments);
      routeMetadata(games || []);
      return result;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.updateGameRAXDirectoryStructuredData = wrapped;
  }

  function restoreSEOCategoryPath() {
    var redirected = new URLSearchParams(
      window.location.search
    ).get("__gamerex_path");

    if (!redirected) return false;

    try {
      var target = new URL(
        redirected,
        window.location.origin
      );

      if (!/^\/category\/[^/]+\/?$/i.test(target.pathname)) {
        return false;
      }

      window.history.replaceState(
        {},
        "",
        target.pathname + target.search + target.hash
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  async function loadCategoryRoute() {
    var list = [];

    try {
      if (typeof window.readCachedGames === "function") {
        list = await window.readCachedGames();
      }

      if (
        (!list || !list.length) &&
        typeof window.getGamesFromSupabase === "function" &&
        navigator.onLine
      ) {
        list = await window.getGamesFromSupabase();

        if (typeof window.writeCachedGames === "function") {
          await window.writeCachedGames(list);
        }
      }

      list = list || [];

      var requested = decodeURIComponent(
        window.location.pathname
          .replace(/^\/category\//i, "")
          .replace(/\/$/, "")
      ).toLowerCase();

      var category = categoryList(list).find(function (name) {
        return slug(name) === requested;
      });

      if (!category) {
        setSEO(HOME_TITLE, HOME_DESCRIPTION, "/");

        if (typeof window.gamerexSetRoute === "function") {
          window.gamerexSetRoute("/", true);
        } else {
          window.history.replaceState({}, "", "/");
        }

        if (typeof window.showHome === "function") {
          window.showHome();
        } else if (typeof window.renderGames === "function") {
          window.renderGames();
        }

        return false;
      }

      if (typeof window.closeGamePlayer === "function") {
        window.closeGamePlayer(false, false);
      }

      if (typeof window.hideAllMainPages === "function") {
        window.hideAllMainPages();
      }

      var home = document.getElementById("homePage");

      if (home) home.style.display = "block";

      window.currentCategory = category;

      try {
        currentCategory = category;
      } catch (error) {}

      if (typeof window.setActiveNav === "function") {
        window.setActiveNav("");
      }

      setSEO(
        "Free " + category + " Games Online - GameRAX",
        "Play free " + category.toLowerCase() +
          " games online on GameRAX. Discover fun browser games and start playing instantly.",
        categoryPath(category)
      );

      if (typeof window.renderGameHome === "function") {
        window.renderGameHome(list);
      }

      window.scrollTo(0, 0);
      return true;
    } catch (error) {
      console.error(
        "GameRAX category route could not be opened.",
        error
      );

      return false;
    }
  }

  function patchFilterCategory() {
    if (
      typeof window.filterCategory !== "function" ||
      window.filterCategory.__gameraxSeoWrapped
    ) return;

    var original = window.filterCategory;

    var wrapped = function (category) {
      var value = category || "All";

      var target =
        String(value).toLowerCase() === "all"
          ? "/"
          : categoryPath(value);

      if (window.location.pathname !== target) {
        window.history.pushState({}, "", target);
      }

      var result = original.apply(this, arguments);

      if (String(value).toLowerCase() === "all") {
        setSEO(HOME_TITLE, HOME_DESCRIPTION, "/");
      } else {
        setSEO(
          "Free " + value + " Games Online - GameRAX",
          "Play free " + String(value).toLowerCase() +
            " games online on GameRAX. Discover fun browser games and start playing instantly.",
          target
        );
      }

      return result;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.filterCategory = wrapped;
  }

  function patchOpenGamePlayer() {
    if (
      typeof window.openGamePlayer !== "function" ||
      window.openGamePlayer.__gameraxSeoWrapped
    ) return;

    var original = window.openGamePlayer;

    var wrapped = async function (game) {
      var result = await original.apply(this, arguments);

      if (game) {
        var path = gamePath(game);

        setSEO(
          game.seoTitle ||
            ("Play " + (game.name || "Game") +
              " Online - GameRAX"),
          game.seoDescription || game.description,
          path
        );

        setGameStructuredData(game);
      }

      return result;
    };

    wrapped.__gameraxSeoWrapped = true;
    window.openGamePlayer = wrapped;
  }

  function patchRouteLoader() {
    if (
      typeof window.openGameFromGamerexRoute !== "function" ||
      window.openGameFromGamerexRoute.__gameraxSeoWrapped
    ) return;

    var original = window.openGameFromGamerexRoute;

    var wrapped = async function () {
      if (
        restoreSEOCategoryPath() ||
        /^\/category\/[^/]+\/?$/i.test(window.location.pathname)
      ) {
        return loadCategoryRoute();
      }

      return original.apply(this, arguments);
    };

    wrapped.__gameraxSeoWrapped = true;
    window.openGameFromGamerexRoute = wrapped;
  }

  function boot() {
    extendGameData();
    addCategoryRouteLinks();
    addGameCardLinks();
    addMiniCardLinks();
    addStructuredDataHook();
    patchFilterCategory();
    patchOpenGamePlayer();
    patchRouteLoader();

    routeMetadata(
      (typeof cachedGamesMemory !== "undefined" &&
        cachedGamesMemory) || []
    );

    window.addEventListener("popstate", function () {
      if (
        restoreSEOCategoryPath() ||
        /^\/category\/[^/]+\/?$/i.test(window.location.pathname)
      ) {
        loadCategoryRoute();
      } else if (
        /^\/game\/[^/]+\/?$/i.test(window.location.pathname)
      ) {
        if (
          typeof window.openGameFromGamerexRoute === "function"
        ) {
          window.openGameFromGamerexRoute();
        }
      } else {
        setSEO(HOME_TITLE, HOME_DESCRIPTION, "/");
      }
    });

    if (typeof window.renderGameHome === "function") {
      try {
        var games =
          (typeof cachedGamesMemory !== "undefined" &&
            cachedGamesMemory) || [];

        if (games.length) {
          window.renderGameHome(games);
        }
      } catch (error) {
        console.warn(
          "GameRAX SEO initial refresh skipped.",
          error
        );
      }
    }
  }

  /*
   * This file should run after the main GameRAX script
   * and before the DOMContentLoaded route handler runs.
   */
  boot();
})();
