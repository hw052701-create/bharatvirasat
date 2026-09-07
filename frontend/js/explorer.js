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

  // Canonical high-res imagery for verified monuments across UP, Gujarat & Punjab
  siteImageMap: {
    // Uttar Pradesh & Lucknow
    'Taj Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg',
    'Agra Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Agra_Fort_in_India.jpg/960px-Agra_Fort_in_India.jpg',
    'Fatehpur Sikri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg/960px-Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg',
    'Bara Imambara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Bara_Imambara_Lucknow.jpg/960px-Bara_Imambara_Lucknow.jpg',
    'Bara Imambara (Asafi Imambara)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Bara_Imambara_Lucknow.jpg/960px-Bara_Imambara_Lucknow.jpg',
    'Chhota Imambara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chota_Imambara%2C_Lucknow.jpg/960px-Chota_Imambara%2C_Lucknow.jpg',
    'Chhota Imambara (Husainabad Imambara)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chota_Imambara%2C_Lucknow.jpg/960px-Chota_Imambara%2C_Lucknow.jpg',
    'Rumi Darwaza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rumi_Darwaza_Lucknow_01.jpg/960px-Rumi_Darwaza_Lucknow_01.jpg',
    'Lucknow Residency': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/The_Residency_Building_Lucknow.jpg/960px-The_Residency_Building_Lucknow.jpg',
    'Dilkusha Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Dilkusha_Kothi_Lucknow.jpg/960px-Dilkusha_Kothi_Lucknow.jpg',
    'Sikandar Bagh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Sikandar_Bagh_Lucknow.jpg/960px-Sikandar_Bagh_Lucknow.jpg',
    'Kaiserbagh Palace Complex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Safed_Baradari_Kaiserbagh.jpg/960px-Safed_Baradari_Kaiserbagh.jpg',
    'Chattar Manzil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Chattar_Manzil_Lucknow.jpg/960px-Chattar_Manzil_Lucknow.jpg',
    'Varanasi Ghats': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg/960px-Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg',
    'Dhamek Stupa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dhamekh_Stupa_Sarnath_01.jpg/960px-Dhamekh_Stupa_Sarnath_01.jpg',
    'Chaukhandi Stupa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Chaukhandi_Stupa_Sarnath.jpg/960px-Chaukhandi_Stupa_Sarnath.jpg',
    'Jhansi Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Jhansi_Fort_Entrance.jpg/960px-Jhansi_Fort_Entrance.jpg',
    'Kalinjar Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Kalinjar_Fort_gate.jpg/960px-Kalinjar_Fort_gate.jpg',
    'Dashavatara Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Dashavatara_Temple_Deogarh_01.jpg/960px-Dashavatara_Temple_Deogarh_01.jpg',
    'Allahabad Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Allahabad_Fort.jpg/960px-Allahabad_Fort.jpg',
    'Khusro Bagh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Khusro_Bagh_Allahabad.jpg/960px-Khusro_Bagh_Allahabad.jpg',
    'Anand Bhavan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Anand_Bhavan_Allahabad.jpg/960px-Anand_Bhavan_Allahabad.jpg',
    'Govind Dev Temple, Vrindavan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Govind_Dev_Ji_Temple_Vrindavan.jpg/960px-Govind_Dev_Ji_Temple_Vrindavan.jpg',
    'Banke Bihari Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bankey_Bihari_Temple_Vrindavan.jpg/960px-Bankey_Bihari_Temple_Vrindavan.jpg',
    'Atala Masjid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Atala_Masjid_Jaunpur.jpg/960px-Atala_Masjid_Jaunpur.jpg',
    'Shahi Bridge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Shahi_Bridge_Jaunpur.jpg/960px-Shahi_Bridge_Jaunpur.jpg',

    // Gujarat
    'Rani-ki-Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rani_ki_vav_02.jpg/960px-Rani_ki_vav_02.jpg',
    'Rani ki Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rani_ki_vav_02.jpg/960px-Rani_ki_vav_02.jpg',
    'Dholavira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dholavira_Eastern_Reservoir.jpg/960px-Dholavira_Eastern_Reservoir.jpg',
    'Champaner-Pavagadh Archaeological Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Jami_Masjid_Champaner_01.jpg/960px-Jami_Masjid_Champaner_01.jpg',
    'Historic City of Ahmedabad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sidi_Saiyyed_Mosque_Jali.jpg/960px-Sidi_Saiyyed_Mosque_Jali.jpg',
    'Adalaj Ni Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Adalaj_Stepwell_01.jpg/960px-Adalaj_Stepwell_01.jpg',
    'Modhera Sun Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Surya_Kund_Sun_temple_Modhera.jpg/960px-Surya_Kund_Sun_temple_Modhera.jpg',
    'Lothal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lothal_dockyard.jpg/960px-Lothal_dockyard.jpg',
    'Uparkot Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Uparkot_Fort_Junagadh.jpg/960px-Uparkot_Fort_Junagadh.jpg',
    'Sarkhej Roza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sarkhej_Roza_Ahmedabad.jpg/960px-Sarkhej_Roza_Ahmedabad.jpg',
    'Bhadra Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Bhadra_Fort_Ahmedabad.jpg/960px-Bhadra_Fort_Ahmedabad.jpg',
    'Aina Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Aina_Mahal_Bhuj.jpg/960px-Aina_Mahal_Bhuj.jpg',
    'Prag Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Prag_Mahal_Bhuj.jpg/960px-Prag_Mahal_Bhuj.jpg',
    'Lakhpat Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Lakhpat_Fort_Kutch.jpg/960px-Lakhpat_Fort_Kutch.jpg',
    'Vijay Vilas Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Vijay_Vilas_Palace_Mandvi.jpg/960px-Vijay_Vilas_Palace_Mandvi.jpg',
    'Laxmi Vilas Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Laxmi_Vilas_Palace_Vadodara.jpg/960px-Laxmi_Vilas_Palace_Vadodara.jpg',
    'Somnath Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Somnath_Temple_Gujarat.jpg/960px-Somnath_Temple_Gujarat.jpg',
    'Dwarkadhish Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Dwarkadhish_Temple.jpg/960px-Dwarkadhish_Temple.jpg',

    // Punjab
    'Sri Harmandir Sahib (Golden Temple)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amritsar_01.jpg/960px-The_Golden_Temple_of_Amritsar_01.jpg',
    'Gobindgarh Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gobindgarh_Fort_Amritsar.jpg/960px-Gobindgarh_Fort_Amritsar.jpg',
    'Jallianwala Bagh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Jallianwala_Bagh_memorial.jpg/960px-Jallianwala_Bagh_memorial.jpg',
    'Qila Mubarak, Patiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Qila_Mubarak_Patiala.jpg/960px-Qila_Mubarak_Patiala.jpg',
    'Qila Mubarak, Bathinda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Qila_Mubarak_Bathinda.jpg/960px-Qila_Mubarak_Bathinda.jpg',
    'Jagatjit Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Jagatjit_Palace_Kapurthala.jpg/960px-Jagatjit_Palace_Kapurthala.jpg',
    'Moorish Mosque, Kapurthala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Moorish_Mosque_Kapurthala.jpg/960px-Moorish_Mosque_Kapurthala.jpg',
    'Sheesh Mahal, Patiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sheesh_Mahal_Patiala.jpg/960px-Sheesh_Mahal_Patiala.jpg',
    'Bahadurgarh Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Bahadurgarh_Fort_Patiala.jpg/960px-Bahadurgarh_Fort_Patiala.jpg',
    'Phillaur Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Phillaur_Fort_Punjab.jpg/960px-Phillaur_Fort_Punjab.jpg',
    'Takht Sri Damdama Sahib': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Damdama_Sahib_Talwandi_Sabo.jpg/960px-Damdama_Sahib_Talwandi_Sabo.jpg',
    'Gurudwara Tarn Taran Sahib': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gurudwara_Tarn_Taran_Sahib.jpg/960px-Gurudwara_Tarn_Taran_Sahib.jpg',
    'Gurudwara Goindwal Sahib': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Goindwal_Sahib_Gurdwara.jpg/960px-Goindwal_Sahib_Gurdwara.jpg',
    'Jandiala Guru Thatheras Heritage Site': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Thatheras_of_Jandiala_Guru.jpg/960px-Thatheras_of_Jandiala_Guru.jpg'
  },

  // Category-based smart image fallbacks for sites without hardcoded images
  categoryImages: {
    // Religious / Temples
    temple: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    gurudwara: 'https://images.unsplash.com/photo-1609947017136-9daf32a15c38?w=800&auto=format&fit=crop&q=80',
    mosque: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    church: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop&q=80',
    imambara: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    stupa: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e13?w=800&auto=format&fit=crop&q=80',
    // Forts & Palaces
    fort: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    qila: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    palace: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    mahal: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    haveli: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
    // Archaeological
    ruins: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    excavation: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    archaeological: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    // Gateways & Monuments
    darwaza: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    gate: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    tower: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
    minar: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
    // Water & Stepwells
    vav: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    stepwell: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    ghat: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    lake: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    // Tombs & Gardens
    tomb: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    maqbara: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    roza: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    bagh: 'https://images.unsplash.com/photo-1585136917228-5fa2c1b57e47?w=800&auto=format&fit=crop&q=80',
    garden: 'https://images.unsplash.com/photo-1585136917228-5fa2c1b57e47?w=800&auto=format&fit=crop&q=80',
    // Museums
    museum: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80',
    // Culture — Food
    food: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    cuisine: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    sweet: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    khakhra: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    handvo: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    dhokla: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    thepla: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    undhiyu: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    fafda: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    chaat: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    biryani: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    kebab: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    lassi: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    kulfi: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    peda: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    chikki: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&auto=format&fit=crop&q=80',
    // Culture — Textiles & Crafts
    textile: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    saree: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    sari: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    embroidery: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    phulkari: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    weaving: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop&q=80',
    pottery: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    craft: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    metalwork: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    // Culture — Dance & Music
    dance: 'https://images.unsplash.com/photo-1547153760-18fc86c9fda1?w=800&auto=format&fit=crop&q=80',
    garba: 'https://images.unsplash.com/photo-1547153760-18fc86c9fda1?w=800&auto=format&fit=crop&q=80',
    bhangra: 'https://images.unsplash.com/photo-1547153760-18fc86c9fda1?w=800&auto=format&fit=crop&q=80',
    raas: 'https://images.unsplash.com/photo-1547153760-18fc86c9fda1?w=800&auto=format&fit=crop&q=80',
    music: 'https://images.unsplash.com/photo-1547153760-18fc86c9fda1?w=800&auto=format&fit=crop&q=80',
    // Culture — Fairs & Festivals
    fair: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    festival: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    mela: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    utsav: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    navratri: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    rann: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    // Nature & Wildlife
    wildlife: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&auto=format&fit=crop&q=80',
    sanctuary: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&auto=format&fit=crop&q=80',
    national_park: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&auto=format&fit=crop&q=80',
    forest: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&auto=format&fit=crop&q=80',
    gir: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&auto=format&fit=crop&q=80',
    // Bridge & Infrastructure
    bridge: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&auto=format&fit=crop&q=80',
  },

  // State-level fallback images
  stateImages: {
    'Uttar Pradesh': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    'Gujarat': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    'Punjab': 'https://images.unsplash.com/photo-1609947017136-9daf32a15c38?w=800&auto=format&fit=crop&q=80',
  },

  // Type-level fallback images
  typeImages: {
    architecture: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop&q=80',
    culture: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=800&auto=format&fit=crop&q=80',
    research: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
  },

  getSiteImage(site) {
    // 1. Check hardcoded verified image map first
    if (Explorer.siteImageMap[site.name]) return Explorer.siteImageMap[site.name];

    // 2. Check database images
    if (site.images && site.images.length > 0 && site.images[0]) return site.images[0];

    // 3. Smart keyword matching — check site name + description for category clues
    const searchText = (site.name + ' ' + (site.description || '')).toLowerCase();
    for (const [keyword, url] of Object.entries(Explorer.categoryImages)) {
      if (searchText.includes(keyword)) return url;
    }

    // 4. State-based fallback
    if (site.state && Explorer.stateImages[site.state]) return Explorer.stateImages[site.state];

    // 5. Type-based fallback
    if (site.type && Explorer.typeImages[site.type]) return Explorer.typeImages[site.type];

    // 6. Generic heritage fallback
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
