// ── explorer.js — Heritage Explorer Module ───────────────────────────────────
const Explorer = {
  currentType: 'all',
  currentState: 'all',
  currentSite: null,
  currentPage: 1,
  totalPages: 1,
  allLoadedSites: [],
  isLoadingMore: false,

  // ─── Render Explorer Page ─────────────────────────────────────────────────
  render() {
    document.getElementById('app-content').innerHTML = `
      <div class="explorer-tabs">
        ${[
          { id: 'all', label: 'All Categories', icon: 'fa-globe' },
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

      <!-- State Quick Filter Chips -->
      <div class="state-filter-row" style="display:flex;gap:0.5rem;overflow-x:auto;padding:0.35rem 1rem 0.85rem;scrollbar-width:none">
        ${[
          { id: 'all', label: 'All States', flag: '🇮🇳' },
          { id: 'Uttar Pradesh', label: 'Uttar Pradesh', flag: '🏛️' },
          { id: 'Gujarat', label: 'Gujarat', flag: '🦁' },
          { id: 'Punjab', label: 'Punjab', flag: '🌾' }
        ].map(s => `
          <button class="state-filter-chip ${Explorer.currentState === s.id ? 'active' : ''}"
            style="padding:5px 14px;border-radius:20px;font-size:0.8rem;font-weight:600;border:1px solid ${Explorer.currentState === s.id ? 'var(--gold)' : 'var(--border)'};background:${Explorer.currentState === s.id ? 'var(--grad-gold)' : 'var(--card-bg2)'};color:${Explorer.currentState === s.id ? 'var(--deep-blue, #0d1b2a)' : 'var(--text-secondary)'};cursor:pointer;white-space:nowrap;transition:all 0.2s;box-shadow:${Explorer.currentState === s.id ? '0 2px 8px rgba(212,175,55,0.3)' : 'none'}"
            onclick="Explorer.setState('${s.id}')">
            ${s.flag} ${s.label}
          </button>
        `).join('')}
      </div>

      <div class="heritage-grid" id="heritage-grid">
        ${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}
      </div>
    `;
    Explorer.currentPage = 1;
    Explorer.allLoadedSites = [];
    Explorer.loadSites();
  },

  // ─── Set Type Filter ──────────────────────────────────────────────────────
  setType(type) {
    Explorer.currentType = type;
    Explorer.render();
  },

  // ─── Set State Filter ─────────────────────────────────────────────────────
  setState(state) {
    Explorer.currentState = state;
    Explorer.render();
  },

  // ─── Load Sites ───────────────────────────────────────────────────────────
  async loadSites(search = '') {
    try {
      const params = { page: Explorer.currentPage, limit: 40 };
      if (Explorer.currentType !== 'all') params.type = Explorer.currentType;
      if (Explorer.currentState !== 'all') params.state = Explorer.currentState;
      if (search) params.search = search;

      const res = await API.getHeritage(params);
      const grid = document.getElementById('heritage-grid');
      if (!grid) return;

      if (Explorer.currentPage === 1 && (!res.data || res.data.length === 0)) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1">
            <i class="fas fa-search"></i>
            <h3>No results found</h3>
            <p>Try a different category or state filter</p>
          </div>`;
        return;
      }

      // Accumulate sites
      Explorer.allLoadedSites = Explorer.allLoadedSites.concat(res.data || []);
      Explorer.totalPages = res.pages || 1;

      // Render all accumulated sites
      let html = Explorer.allLoadedSites.map(site => Explorer.renderCard(site)).join('');

      // Show total count
      html = `<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding:0 0.25rem">
        <span style="font-size:0.82rem;color:var(--text-muted)"><i class="fas fa-landmark" style="margin-right:4px;color:var(--gold)"></i> Showing <strong style="color:var(--text-primary)">${Explorer.allLoadedSites.length}</strong> of <strong style="color:var(--gold)">${res.total || Explorer.allLoadedSites.length}</strong> sites</span>
      </div>` + html;

      // Add Load More button if there are more pages
      if (Explorer.currentPage < Explorer.totalPages) {
        html += `
          <div style="grid-column:1/-1;text-align:center;padding:1.5rem 0">
            <button class="btn-primary" id="load-more-btn" onclick="Explorer.loadMore()" style="padding:10px 32px;font-size:0.9rem;border-radius:12px">
              <i class="fas fa-plus-circle" style="margin-right:6px"></i>Load More Sites
              <span style="font-size:0.75rem;opacity:0.7;margin-left:8px">(Page ${Explorer.currentPage} of ${Explorer.totalPages})</span>
            </button>
          </div>`;
      } else if (Explorer.allLoadedSites.length > 0) {
        html += `
          <div style="grid-column:1/-1;text-align:center;padding:1rem 0;color:var(--text-muted);font-size:0.82rem">
            <i class="fas fa-check-circle" style="color:var(--gold);margin-right:4px"></i> All ${Explorer.allLoadedSites.length} heritage sites loaded
          </div>`;
      }

      grid.innerHTML = html;
    } catch (err) {
      const grid = document.getElementById('heritage-grid');
      if (grid && Explorer.currentPage === 1) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <i class="fas fa-wifi"></i><h3>Connection Error</h3><p>${err.message}</p>
        </div>`;
      }
    }
  },

  // ─── Load More (Pagination) ────────────────────────────────────────────────
  async loadMore() {
    if (Explorer.isLoadingMore || Explorer.currentPage >= Explorer.totalPages) return;
    Explorer.isLoadingMore = true;
    const btn = document.getElementById('load-more-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
    Explorer.currentPage++;
    await Explorer.loadSites();
    Explorer.isLoadingMore = false;
  },

  // Canonical imagery & custom user links from site_images.txt
  siteImageMap: {
    // Custom user links
    'Jallianwala Bagh': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jallianwala_Bagh.jpg',
    'Ram Tirath Temple Complex': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ramtirath.jpg',
    'Moorish Mosque': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Moorish_Mosque_of_Kapurthala_in_the_state_of_Punjab_02.jpg',
    'Baradari Gardens heritage structures': 'https://wanderon-images.gumlet.io/blogs/new/2024/04/baradari-garden-min.jpg',
    'Gurudwara Nanaksar, Jagraon historical complex': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Photograph_of_the_main_entrance-gate_to_Gurdwara_Nanaksar_Sahib%2C_located_in_Kaleran%2C_near_Jagraon_in_the_Ludhiana_district_of_Punjab%2C_India%2C_9_April_2023.jpg',
    'Pushpa Gujral Science City heritage museum area': 'https://ptcnews-wp.s3.ap-south-1.amazonaws.com/wp-content/uploads/2020/10/unnamed-1.jpg',
    'Baba Bakala Sahib historical gurdwara': 'https://newz24india.com/wp-content/uploads/2025/07/baba-baakala-780x470.jpg',
    'Sanghol Archaeological Site': 'https://mindtrip.ai/cdn-cgi/image/format%3Dwebp%2Cw%3D1200/https%3A/images.mindtrip.ai/locations/67da/7dc6/bd4f/0f4f/9d92/5745/fd6c/805b',
    'Mubarak Manzil': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mubarak_Manzil_Palace%2C_Malerkotla_01.jpg',
    'Panch Mandir': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Photograph_of_the_Panch_Mandir%2C_Kapurthala%2C_Kapurthala_State%2C_published_in_%27Indian_States%2C_A_Biographical%2C_Historical%2C_and_Administrative_Survey%27_%281922%29_%28cropped%29.jpg',
    'Virasat-e-Khalsa heritage complex': 'https://topplacesindia.com/img/attractions/punjab/virasat-e-khalsa/virasat-e-khalsa-hero.jpg',
    'Khalsa College Main Building': 'https://amritsar.guide/assets/static/locations/gallery/1617096936_45_2.jpg',
    'Akal Takht Sahib': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Akal_takht.jpg',
    'Gurudwara Sri Fatehgarh Sahib': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Original_Gurdwara_Sri_Fatehgarh_Sahib.jpg',
    'Bathinda Fort (Qila Mubarak)': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Qila_Mubarak_in_Bathinda.jpg',
    'Durgiana Temple': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Durgiana_Temple%2C_Amritsar.jpg',
    'Phillaur Fort (Maharaja Ranjit Singh Fort)': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Phillaur-fort.jpg',
    'Pul Kanjri': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pul_Kanjari.JPG',
    'Mahabat Khan Maqbara': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mahabat_ka_Makbara_Junagadh_India.jpg',
    'Aina Mahal': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Aina_mahal.jpg_01.jpg',
    'Prag Mahal': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Prag_Mahal_Bhuj.jpg',
    'Adalaj Ni Vav': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Adalaj_ki_Vav_Gujarat_240A1370_72.jpg',
    'Vijay Vilas Palace': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Vijay_Vilas_Palace_Mandvi_02.jpg',
    'Adi Kadi Vav': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Adi_kadi_vav_-_Junagadh_-Gujrat-DSC0002.jpg',
    'Sarkhej Roza': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sarkhej_Roza.jpg',
    'Rani-ki-Vav': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rani_ki_vav7%2C_patan%2C_gujarat.jpg',
    'Rani ki Vav': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rani_ki_vav7%2C_patan%2C_gujarat.jpg',
    'Modhera Sun Temple': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Modhera_sun_temple_Gujarat.jpg',
    'Sun Temple, Modhera': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Modhera_sun_temple_Gujarat.jpg',
    'Uparkot Fort': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Uparkot_fort_of_Junagadh.jpg',
    'Alamgir Mosque': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Husainabad_Clock_Tower_-_Lucknow.jpg',
    'Tomb of Salim Chishti': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/TombSalimChisti.jpg',
    'Akbar\'s Tomb, Sikandra': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Akbar%27s_Tomb.jpg',
    'Tomb of Saadat Ali Khan': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tomb_of_Saadat_Ali_Khan_-Lucknow.jpg',
    'Dhamek Stupa': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/SARNATH_DHAMEK_STUPA.jpg',
    'Bara Imambara': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bara_Imambara_Lucknow_Uttar_Pradesh.jpg',
    'Lucknow Residency': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lucknow_Residency.jpg',
    'Rumi Darwaza': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rumi_Darwaza_in_Lucknow.jpg',
    'Taj Mahal': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Taj_Mahal%2C_Agra%2C_India.jpg',

    // Other verified defaults
    'Agra Fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    'Fatehpur Sikri': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    'Sri Harmandir Sahib (Golden Temple)': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    'Golden Temple': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    'Gobindgarh Fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    'Kashi Vishwanath Temple': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    'Somnath Temple': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    'Dwarkadhish Temple': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    'Gir National Park': 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    'Rann of Kutch': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
  },

  // Category & keyword-based verified images (100% tested HTTP 200)
  categoryImages: {
    // Religious / Temples / Shrines
    temple: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    mandir: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    shrine: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    dham: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    tirath: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    // Sikh Heritage & Gurdwaras
    gurdwara: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    gurudwara: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    sahib: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    // Indo-Islamic, Mosques & Mausoleums
    mosque: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop&q=80',
    masjid: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop&q=80',
    maqbara: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    tomb: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    roza: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    imambara: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    // Forts & Ramparts
    fort: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    qila: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    kila: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    garhi: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    // Palaces & Havelis
    palace: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    mahal: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    haveli: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    kothi: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    darwaza: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    gate: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    minar: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    // Stepwells & Water Heritage
    vav: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    stepwell: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    baoli: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    ghat: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    kund: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    // Archaeology, Stupas & Ancient Ruins
    archaeological: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    stupa: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    ruins: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    excavation: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    // Freedom Struggle & Memorials
    memorial: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    smarak: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    shaheed: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    freedom: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    jallianwala: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    // Traditional Cuisines & Snacks (Food)
    food: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    cuisine: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    dish: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    snack: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    thali: 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?w=800&auto=format&fit=crop&q=80',
    khakhra: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    handvo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    dhokla: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    thepla: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    fafda: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    ganthiya: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    rotlo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    undhiyu: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    lassi: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    biryani: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    kebab: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    chaat: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    sweet: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    sweets: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    peda: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    petha: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    jalebi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    makki: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    sarson: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    // Crafts, Textiles & Arts
    craft: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    crafts: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    textile: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    weaving: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    saree: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    sari: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    phulkari: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    patola: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    bandhani: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    chikankari: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    brass: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    metal: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    pottery: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    // Fairs, Dance, Music & Festivals
    fair: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    mela: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    festival: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    utsav: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    dance: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    garba: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    bhangra: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    // Nature, Wildlife & Gardens
    garden: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    bagh: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    wildlife: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    sanctuary: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    park: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    forest: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    gir: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80',
    rann: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    desert: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    bridge: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&auto=format&fit=crop&q=80'
  },

  // State-level verified fallback images
  stateImages: {
    'Uttar Pradesh': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    'Gujarat': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    'Punjab': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80'
  },

  // Type-level verified fallback images
  typeImages: {
    architecture: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    culture: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    research: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
  },

  getSiteImage(site) {
    if (!site) return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80';

    // 1. Check verified hardcoded landmark & custom map first
    if (Explorer.siteImageMap[site.name]) return Explorer.siteImageMap[site.name];

    // 2. Check DB site.images (if present and not old generic placeholder)
    if (site.images && site.images.length > 0 && site.images[0] && !site.images[0].includes('unsplash.com/photo-1590050752117')) {
      return site.images[0];
    }

    // 3. Smart keyword matching on site name and description
    const searchText = (site.name + ' ' + (site.description || '') + ' ' + (site.shortDesc || '') + ' ' + (site.tags ? site.tags.join(' ') : '')).toLowerCase();
    
    for (const [keyword, url] of Object.entries(Explorer.categoryImages)) {
      if (searchText.includes(keyword)) return url;
    }

    // 4. State fallback
    if (site.state && Explorer.stateImages[site.state]) return Explorer.stateImages[site.state];

    // 5. Type fallback
    if (site.type && Explorer.typeImages[site.type]) return Explorer.typeImages[site.type];

    // 6. Universal high-res heritage fallback
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80';
  },

  // ─── Render Heritage Card ─────────────────────────────────────────────────
  renderCard(site) {
    const typeIcons = {
      architecture: '🏛️', culture: '🎭', research: '📚', geohunt: '🗺️'
    };
    const img = Explorer.getSiteImage(site);

    return `
      <div class="card heritage-card" onclick="Explorer.viewSite('${site._id}')">
        <img src="${img}" alt="${site.name}" loading="lazy" referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80'" />
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
            <div class="card-state"><i class="fas fa-map-marker-alt" style="color:var(--saffron);margin-right:3px"></i>${site.city ? site.city + ', ' : ''}${site.state}</div>
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
        <img src="${img}" alt="${site.name}" referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80'" />
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
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem">
          ${site.isUNESCO ? '<div class="card-type" style="background:rgba(212,175,55,0.2);color:var(--gold);border:1px solid var(--gold)"><span>🌍</span> UNESCO World Heritage</div>' : ''}
          ${site.isASIProtected ? '<div class="card-type" style="background:rgba(76,175,80,0.15);color:#81c784;border:1px solid rgba(76,175,80,0.4)"><span>🏛️</span> ASI Protected</div>' : ''}
          <div class="card-type"><span>📍</span> ${site.state}</div>
        </div>

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

        <!-- Official Verified Source Link Box -->
        ${site.sourceUrl ? `
          <div style="margin:1rem 0;padding:0.875rem 1rem;background:var(--card-bg2);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:0.75rem;box-shadow:var(--shadow-card)">
            <div style="display:flex;align-items:center;gap:10px;min-width:0">
              <i class="fas fa-shield-alt" style="color:var(--gold);font-size:1.25rem;flex-shrink:0"></i>
              <div style="min-width:0">
                <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary)">Verified Official Source</div>
                <div style="font-size:0.73rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${site.sourceUrl}</div>
              </div>
            </div>
            <a href="${site.sourceUrl}" target="_blank" rel="noopener noreferrer"
              class="btn-secondary" style="padding:6px 14px;font-size:0.8rem;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;border-radius:8px;text-decoration:none;flex-shrink:0">
              <span>View Source</span> <i class="fas fa-external-link-alt" style="font-size:0.7rem"></i>
            </a>
          </div>` : ''}

        <p class="detail-desc">${site.description}</p>

        ${site.significance ? `
          <div class="daily-challenge" style="margin:0 0 1rem;background:var(--card-bg2)">
            <div class="challenge-badge" style="background:var(--grad-gold);color:var(--deep-blue)">Significance & Heritage</div>
            <p class="challenge-desc" style="margin:0;color:var(--text-primary);line-height:1.6">${site.significance}</p>
          </div>` : ''}

        <!-- Embedded Historical Chronicle & Backstory -->
        ${(() => {
          const chronicleText = typeof AIGuide !== 'undefined' ? AIGuide.getStoryFallback(site.name) : '';
          if (chronicleText) {
            const firstPara = chronicleText.split('\n\n')[0] || chronicleText;
            return `
              <div style="background:linear-gradient(145deg, var(--card-bg2), var(--card-bg));border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.15rem;margin:1rem 0;box-shadow:var(--shadow-card)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem">
                  <div style="display:flex;align-items:center;gap:6px;color:var(--gold);font-weight:700;font-size:0.95rem">
                    <i class="fas fa-scroll"></i> Historical Chronicle & Lore
                  </div>
                  <span style="font-size:0.7rem;color:var(--text-muted);letter-spacing:0.5px">ANCIENT CHRONICLES</span>
                </div>
                <p style="font-size:0.86rem;line-height:1.7;color:var(--text-primary);margin-bottom:0.75rem">
                  ${typeof AIGuide !== 'undefined' ? AIGuide.formatMarkdown(firstPara) : firstPara}
                </p>
                <button onclick="AIGuide.fetchChronicle('${site.name.replace(/'/g, "\\'")}')"
                  style="background:none;border:none;color:var(--gold);font-weight:700;font-size:0.82rem;padding:0;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
                  <span>Read Full Historical Chronicle</span> <i class="fas fa-arrow-right" style="font-size:0.75rem"></i>
                </button>
              </div>`;
          }
          return '';
        })()}

        ${site.tags && site.tags.length ? `
          <div class="detail-tags" style="margin-bottom:1.25rem">
            ${site.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
          </div>` : ''}

        <div class="detail-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <button class="btn-primary" onclick="AIGuide.askAbout('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-comments"></i> Ask Virasat AI
          </button>
          <button class="btn-secondary" onclick="AIGuide.fetchChronicle('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-scroll"></i> Chronicle & Lore
          </button>
        </div>

        <div class="detail-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:0.75rem">
          <button class="btn-secondary" onclick="Community.openCreatePost('${site._id}', '${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-feather-alt"></i> Share Experience
          </button>
          <button class="btn-secondary" onclick="Explorer.shareStory('${site.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-share-alt"></i> Share Site
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
      <h3 style="margin-bottom:1rem">📖 The Legend of ${siteName}</h3>
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem;font-size:0.85rem">Summoning ancient legends with Virasat AI...</p>
      </div>`);

    try {
      const res = await API.generateStory(siteName);
      const storyText = (res && res.story)
        ? res.story
        : (typeof AIGuide !== 'undefined' ? AIGuide.getStoryFallback(siteName) : `Centuries ago in the golden heart of India, master sculptors and architects gathered to create ${siteName}.`);
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 The Legend of ${siteName}</h3>
        <p style="line-height:1.85;color:var(--text-secondary);font-size:0.92rem;font-style:italic">${storyText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</p>
        <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
          <button class="btn-secondary" style="flex:1" onclick="Explorer.shareStory('${siteName.replace(/'/g, "\\'")}')">
            <i class="fas fa-share-alt"></i> Share Legend
          </button>
          <button class="btn-primary" style="flex:1" onclick="App.closeModal()">
            <span>Close</span>
          </button>
        </div>`;
    } catch {
      const fallback = typeof AIGuide !== 'undefined' ? AIGuide.getStoryFallback(siteName) : `Centuries ago, master artisans gathered to construct ${siteName}.`;
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 The Legend of ${siteName}</h3>
        <p style="line-height:1.85;color:var(--text-secondary);font-size:0.92rem;font-style:italic">${fallback.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</p>
        <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">
          <span>Close</span>
        </button>`;
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
