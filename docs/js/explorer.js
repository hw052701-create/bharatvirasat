// ── explorer.js — Heritage Explorer Module ───────────────────────────────────
const Explorer = {
  currentType: 'all',
  currentSite: null,

  // ─── Render Explorer Page ─────────────────────────────────────────────────
  render() {
    document.getElementById('app-content').innerHTML = `
      <div class="explorer-tabs">
        ${[
          { id: 'all', label: 'All', icon: 'fa-globe' },
          { id: 'architecture', label: 'Architecture', icon: 'fa-landmark' },
          { id: 'culture', label: 'Culture', icon: 'fa-masks-theater' },
          { id: 'research', label: 'Research', icon: 'fa-book-open' }
        ].map(t => `
          <button class="tab-btn ${Explorer.currentType === t.id ? 'active' : ''}"
            onclick="Explorer.setType('${t.id}')">
            <i class="fas ${t.icon}"></i>${t.label}
          </button>
        `).join('')}
      </div>
      <div class="heritage-grid" id="heritage-grid">
        ${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}
      </div>
    `;
    Explorer.loadSites();
  },

  // ─── Set Type Filter ──────────────────────────────────────────────────────
  setType(type) {
    Explorer.currentType = type;
    Explorer.render();
  },

  // ─── Load Sites ───────────────────────────────────────────────────────────
  async loadSites(search = '') {
    try {
      const params = {};
      if (Explorer.currentType !== 'all') params.type = Explorer.currentType;
      if (search) params.search = search;

      const res = await API.getHeritage(params);
      const grid = document.getElementById('heritage-grid');
      if (!grid) return;

      if (!res.data || res.data.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1">
            <i class="fas fa-search"></i>
            <h3>No results found</h3>
            <p>Try a different filter or search term</p>
          </div>`;
        return;
      }

      grid.innerHTML = res.data.map(site => Explorer.renderCard(site)).join('');
    } catch (err) {
      const grid = document.getElementById('heritage-grid');
      if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-wifi"></i><h3>Connection Error</h3><p>${err.message}</p>
      </div>`;
    }
  },

  // Exact canonical authentic monument photography for all 21 sites
  siteImageMap: {
    'Taj Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg',
    'Red Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Delhi_fort.jpg/960px-Delhi_fort.jpg',
    'Hampi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg',
    'Ajanta Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg',
    'Khajuraho Temples': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/1_Khajuraho.jpg/960px-1_Khajuraho.jpg',
    'Konark Sun Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/960px-Konarka_Temple.jpg',
    'Holi Festival': 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&auto=format&fit=crop&q=80',
    'Madhubani Paintings': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Madhubani_Mahavidyas.jpg',
    'Bharatnatyam': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Murugashankari_Leo.jpg',
    'Qutub Minar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Qutb_Minar_2022.jpg/960px-Qutb_Minar_2022.jpg',
    'Ellora Caves': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Courtyard_and_Mahabharata_Reliefs_at_the_Kailasa_Temple%2C_Ellora_01.jpg/960px-Courtyard_and_Mahabharata_Reliefs_at_the_Kailasa_Temple%2C_Ellora_01.jpg',
    'Fatehpur Sikri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg/960px-Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg',
    'Mahabalipuram Shore Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Shore_Temple_-Mamallapuram_-Tamil_Nadu_-N-TN-C55.jpg/960px-Shore_Temple_-Mamallapuram_-Tamil_Nadu_-N-TN-C55.jpg',
    'Sanchi Stupa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/East_Gateway_-_Stupa_1_-_Sanchi_Hill_2013-02-21_4398.JPG/960px-East_Gateway_-_Stupa_1_-_Sanchi_Hill_2013-02-21_4398.JPG',
    'Pattadakal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG',
    'Nalanda University Ruins': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Temple_No.-_3%2C_Nalanda_Archaeological_Site.jpg/960px-Temple_No.-_3%2C_Nalanda_Archaeological_Site.jpg',
    'Rani ki Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rani_ki_vav_02.jpg/960px-Rani_ki_vav_02.jpg',
    'Chola Bronze Sculptures': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Le_temple_de_Brihadishwara_%28Tanjore%2C_Inde%29_%2814354574611%29.jpg/960px-Le_temple_de_Brihadishwara_%28Tanjore%2C_Inde%29_%2814354574611%29.jpg',
    'Varanasi Ghats': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg/960px-Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg',
    'Meenakshi Amman Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/960px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg',
    'Mysore Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg'
  },

  getSiteImage(site) {
    if (Explorer.siteImageMap[site.name]) return Explorer.siteImageMap[site.name];
    if (site.images && site.images.length > 0 && site.images[0]) return site.images[0];
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80';
  },

  // ─── Render Heritage Card ─────────────────────────────────────────────────
  renderCard(site) {
    const typeIcons = {
      architecture: '🏛️', culture: '🎭', research: '📚', geohunt: '🗺️'
    };
    const img = Explorer.getSiteImage(site);

    return `
      <div class="card heritage-card" onclick="Explorer.viewSite('${site._id}')">
        <img src="${img}" alt="${site.name}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80'" />
        <div class="card-body">
          <div class="card-type">
            <span>${typeIcons[site.type] || '🏛️'}</span> ${site.type}
          </div>
          <div class="card-title">${site.name}</div>
          <div class="card-subtitle">${site.shortDesc || site.description.slice(0, 80) + '...'}</div>
          <div class="card-footer">
            <div class="card-rating">
              <i class="fas fa-star"></i> ${site.rating || '4.5'}
              <span style="color:var(--text-muted)">(${(site.reviewCount || 0).toLocaleString()})</span>
            </div>
            <div class="card-state"><i class="fas fa-map-marker-alt" style="color:var(--saffron);margin-right:3px"></i>${site.state}</div>
          </div>
        </div>
      </div>`;
  },

  // ─── View Site Detail ─────────────────────────────────────────────────────
  async viewSite(id) {
    document.getElementById('app-content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:50vh">
        <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
      </div>`;

    try {
      const res = await API.getHeritageSite(id);
      Explorer.currentSite = res.data;
      Explorer.renderDetail(res.data);
    } catch (err) {
      App.showToast('Failed to load site details', 'error');
      Explorer.render();
    }
  },

  // ─── Render Detail Page ───────────────────────────────────────────────────
  renderDetail(site) {
    const img = Explorer.getSiteImage(site);

    const savedSites = JSON.parse(localStorage.getItem('bv_saved') || '[]');
    const isSaved = savedSites.includes(site._id);

    document.getElementById('app-content').innerHTML = `
      <div class="detail-hero">
        <img src="${img}" alt="${site.name}"
          onerror="this.src='https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80'" />
        <div class="detail-hero-overlay"></div>
        <button class="detail-back" onclick="Explorer.render()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <button class="detail-save ${isSaved ? 'saved' : ''}" id="save-btn"
          onclick="Explorer.toggleSave('${site._id}')">
          <i class="fas fa-bookmark"></i>
        </button>
      </div>

      <div class="detail-content">
        ${site.isUNESCO ? '<div class="card-type"><span>🌍</span> UNESCO World Heritage</div>' : ''}
        ${site.isASIProtected ? '<div class="card-type" style="margin-top:0.25rem"><span>🏛️</span> ASI Protected</div>' : ''}

        <h1 class="detail-title">${site.name}</h1>
        <div class="detail-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${site.city ? site.city + ', ' : ''}${site.state}</span>
        </div>

        <div class="detail-meta">
          ${site.builtIn ? `<div class="meta-chip"><i class="fas fa-calendar-alt"></i> Built: ${site.builtIn}</div>` : ''}
          ${site.dynasty ? `<div class="meta-chip"><i class="fas fa-crown"></i> ${site.dynasty}</div>` : ''}
          <div class="meta-chip"><i class="fas fa-star"></i> ${site.rating} rating</div>
          <div class="meta-chip"><i class="fas fa-eye"></i> ${(site.views || 0).toLocaleString()} views</div>
        </div>

        <p class="detail-desc">${site.description}</p>

        ${site.significance ? `
          <div class="daily-challenge" style="margin:0 0 1rem">
            <div class="challenge-badge">Significance</div>
            <p class="challenge-desc" style="margin:0">${site.significance}</p>
          </div>` : ''}

        ${site.tags && site.tags.length ? `
          <div class="detail-tags">
            ${site.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
          </div>` : ''}

        <div class="detail-actions">
          <button class="btn-secondary" onclick="AIGuide.askAbout('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-robot"></i> AI Guide
          </button>
          <button class="btn-accent" onclick="Explorer.generateStory('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-book-open"></i> Story
          </button>
        </div>

        <div class="detail-actions" style="margin-top:0.75rem">
          <button class="btn-secondary" onclick="Explorer.shareStory('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-share-alt"></i> Share
          </button>
          <button class="btn-secondary" onclick="Community.openCreatePost('${site._id}', '${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-pen"></i> Write Story
          </button>
        </div>
      </div>`;
  },

  // ─── Toggle Save ──────────────────────────────────────────────────────────
  async toggleSave(siteId) {
    try {
      const savedSites = JSON.parse(localStorage.getItem('bv_saved') || '[]');
      const isSaved = savedSites.includes(siteId);
      const btn = document.getElementById('save-btn');

      if (isSaved) {
        const updated = savedSites.filter(id => id !== siteId);
        localStorage.setItem('bv_saved', JSON.stringify(updated));
        btn.classList.remove('saved');
        App.showToast('Removed from saved', 'info');
      } else {
        savedSites.push(siteId);
        localStorage.setItem('bv_saved', JSON.stringify(savedSites));
        btn.classList.add('saved');
        App.showToast('Saved to your list! ⭐', 'success');
      }

      // Sync with backend (non-blocking)
      API.saveSite(siteId).catch(() => {});
    } catch (err) {
      App.showToast('Failed to save', 'error');
    }
  },

  // ─── Generate AI Story ────────────────────────────────────────────────────
  async generateStory(siteName) {
    App.showModal(`
      <h3 style="margin-bottom:1rem">📖 Story: ${siteName}</h3>
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem;font-size:0.85rem">Generating story with AI...</p>
      </div>`);

    try {
      const res = await API.generateStory(siteName);
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 ${siteName}</h3>
        <p style="line-height:1.8;color:var(--text-secondary);font-size:0.95rem;font-style:italic">${res.story}</p>
        <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">
          <span>Close</span>
        </button>`;
    } catch {
      document.getElementById('modal-content').innerHTML = `
        <p style="color:var(--danger)">Failed to generate story. Please try again.</p>`;
    }
  },

  // ─── Share ────────────────────────────────────────────────────────────────
  async shareStory(name) {
    if (navigator.share) {
      await navigator.share({
        title: `${name} - BharatVirasat`,
        text: `Discover ${name} on BharatVirasat - India's Heritage Platform`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      App.showToast('Link copied to clipboard!', 'success');
    }
  }
};
