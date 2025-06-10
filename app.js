
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("new-category-input");
  const dropdown = document.getElementById("dropdown-category-list");

  const loadState = () => {
    return {
      visitedUrls: JSON.parse(localStorage.getItem("visitedUrls") || "[]"),
      clickedUrls: JSON.parse(localStorage.getItem("clickedUrls") || "[]"),
      userCategories: JSON.parse(localStorage.getItem("userCategories") || "[]"),
      sortOrder: localStorage.getItem("sortOrder") || "default",
      lastAddedUrl: localStorage.getItem("lastAddedUrl") || null,
      highlightColor: localStorage.getItem("highlightColor") || "green"
    };
  };

  const saveState = (data) => {
    for (const key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  };

  document.getElementById("add-category-btn").addEventListener("click", () => {
    const newCategory = input.value.trim();
    if (!newCategory) return;

    const state = loadState();
    if (!state.userCategories.includes(newCategory)) {
      state.userCategories.push(newCategory);
      saveState({ userCategories: state.userCategories });
      input.value = "";
      loadUrls();
    }
  });

  document.getElementById("save-btn").addEventListener("click", () => {
    const url = prompt("Enter URL to save:");
    if (!url) return;
    const category = categorizeUrl(url);

    const state = loadState();
    if (!state.visitedUrls.some(item => item.url === url)) {
      state.visitedUrls.push({ url, category, originalCategory: category });
      state.lastAddedUrl = url;
      state.highlightColor = "green";
    } else {
      state.lastAddedUrl = url;
      state.highlightColor = "orange";
    }
    saveState(state);
    loadUrls();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    localStorage.setItem("clickedUrls", "[]");
    loadUrls();
  });

  document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener("change", () => {
      localStorage.setItem("sortOrder", radio.value);
      loadUrls();
    });
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const data = loadState();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartlinksaver_export.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-btn").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.visitedUrls)) {
          saveState({
            visitedUrls: data.visitedUrls,
            userCategories: data.userCategories || []
          });
          loadUrls();
        } else {
          alert("Invalid format.");
        }
      } catch (err) {
        alert("File error: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  function categorizeUrl(url) {
    const rules = {
      "google.com": "Search", "youtube.com": "Video",
      "facebook.com": "Social", "twitter.com": "Social",
      "github.com": "Code", "wikipedia.org": "Docs",
      "amazon.com": "Store", "chatgpt.com": "AI"
    };
    for (const key in rules) {
      if (url.includes(key)) return rules[key];
    }
    return "Other";
  }

  function loadUrls() {
    const state = loadState();
    const list = document.getElementById("url-list");
    list.innerHTML = "";

    let urls = state.visitedUrls.slice();
    if (state.sortOrder === "category") {
      urls.sort((a, b) => (a.category || "Other").localeCompare(b.category || "Other"));
    }

    const allCats = [...new Set(["News", "Video", "Docs", "Code", "Social", "Store", "AI", "Other", ...state.userCategories])];

    urls.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "link-row";

      if (item.url === state.lastAddedUrl) {
        li.style.backgroundColor = state.highlightColor === "orange" ? "#e67e22" : "#388e3c";
        setTimeout(() => li.style.backgroundColor = "transparent", 1500);
      }

      const indexSpan = document.createElement("span");
      indexSpan.textContent = (index + 1) + ". ";
      li.appendChild(indexSpan);

      const select = document.createElement("select");
      select.className = "category";
      allCats.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (opt === item.category) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener("change", () => {
        item.category = select.value;
        saveState({ visitedUrls: state.visitedUrls });
        loadUrls();
      });
      li.appendChild(select);

      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.textContent = item.url;
      a.className = "link";
      if (state.clickedUrls.includes(item.url)) a.classList.add("clicked");
      a.addEventListener("click", () => {
        if (!state.clickedUrls.includes(item.url)) {
          state.clickedUrls.push(item.url);
          saveState({ clickedUrls: state.clickedUrls });
        }
      });
      li.appendChild(a);

      const del = document.createElement("button");
      del.textContent = "x";
      del.className = "delete-btn";
      del.addEventListener("click", () => {
        state.visitedUrls = state.visitedUrls.filter(i => i.url !== item.url);
        saveState({ visitedUrls: state.visitedUrls });
        loadUrls();
      });
      li.appendChild(del);

      list.appendChild(li);
    });

    const dropdown = document.getElementById("dropdown-category-list");
    dropdown.innerHTML = "";
    state.userCategories.forEach(cat => {
      const div = document.createElement("div");
      div.textContent = cat;
      const x = document.createElement("span");
      x.textContent = " ×";
      x.style.cursor = "pointer";
      x.style.color = "red";
      x.addEventListener("click", () => {
        state.userCategories = state.userCategories.filter(c => c !== cat);
        state.visitedUrls = state.visitedUrls.map(link =>
          link.category === cat ? { ...link, category: link.originalCategory || "Other" } : link
        );
        saveState({ userCategories: state.userCategories, visitedUrls: state.visitedUrls });
        loadUrls();
      });
      div.appendChild(x);
      dropdown.appendChild(div);
    });
  }

  loadUrls();
});
