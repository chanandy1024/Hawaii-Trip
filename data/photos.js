// Photos for the highlight, activity and stay cards.
//
// Keyed by the same slot key the views already use: hl* for the overview
// highlights, a_<activity id>, h_<hotel id>. Anything pasted in through the photo
// bar is kept separately in state.imgs and shows up alongside these.
//
// The files live in assets/photos rather than being linked from Wikimedia, so the
// page does not depend on anyone else's server staying up or on a file keeping its
// name. Every one is under a licence that permits redistribution *with credit*, so
// `by` and `lic` are not decoration — the credit line under each section is built
// from them, and `page` points at the Commons file page carrying the full licence.
// Swap a photo, swap its credit with it.

export const PHOTOS = {
  hl1: [
    {
      url: "./assets/photos/hl1.jpg",
      by: "Bossfrog",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Molokini-crater-maui.jpg"
    }
  ],
  hl2: [
    {
      url: "./assets/photos/hl2.jpg",
      by: "Katie (alaskahokie)",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Bamboo_forest,_Pipiwai_Trail.jpg"
    }
  ],
  hl3: [
    {
      url: "./assets/photos/hl3.jpg",
      by: "National Park Service",
      lic: "Public domain",
      page: "https://commons.wikimedia.org/wiki/File:Haleakala_sunrise.jpg"
    }
  ],
  hl4: [
    {
      url: "./assets/photos/hl4.jpg",
      by: "Qyd",
      lic: "CC BY 2.5",
      page: "https://commons.wikimedia.org/wiki/File:Hanauma_Bay-aerial.JPG"
    }
  ],
  hl5: [
    {
      url: "./assets/photos/hl5.jpg",
      by: "MahaloMichael",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:KH6ML_Mokulua_Sunrise_from_Lanikai_Pillbox.jpg"
    }
  ],
  hl6: [
    {
      url: "./assets/photos/hl6.jpg",
      by: "Bernard Spragg. NZ",
      lic: "CC0",
      page: "https://commons.wikimedia.org/wiki/File:Sailing_into_the_Sunset.Waikiki._(10814060045).jpg"
    }
  ],
  hl7: [
    {
      url: "./assets/photos/hl7.jpg",
      by: "Daniel Ramirez",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Waikiki_Hilton_Fireworks_(4607529911).jpg"
    }
  ],
  a_charter: [
    {
      url: "./assets/photos/a_charter.jpg",
      by: "Bernard Spragg. NZ",
      lic: "CC0",
      page: "https://commons.wikimedia.org/wiki/File:Sailing_into_the_Sunset.Waikiki._(10814060045).jpg"
    }
  ],
  a_diamondhead: [
    {
      url: "./assets/photos/a_diamondhead.jpg",
      by: "Prayitno / Thank you for (12 millions +) view",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Diamond_Head_Crater_%2B_Waikiki_Beach_(15361623910).jpg"
    }
  ],
  a_fireworks: [
    {
      url: "./assets/photos/a_fireworks.jpg",
      by: "Daniel Ramirez",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Waikiki_Hilton_Fireworks_(4608140598).jpg"
    }
  ],
  a_halesunrise: [
    {
      url: "./assets/photos/a_halesunrise.jpg",
      by: "National Park Service",
      lic: "Public domain",
      page: "https://commons.wikimedia.org/wiki/File:Haleakala_sunrise.jpg"
    }
  ],
  a_halesunset: [
    {
      url: "./assets/photos/a_halesunset.jpg",
      by: "kevinmcgill",
      lic: "CC BY-SA 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Haleakala_Crater_(4596947471).jpg"
    }
  ],
  a_hana: [
    {
      url: "./assets/photos/a_hana.jpg",
      by: "Thomas",
      lic: "CC BY-SA 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Waimoku_Falls_-_Flickr_-_Thomas_James_Caldwell.jpg"
    }
  ],
  a_hanauma: [
    {
      url: "./assets/photos/a_hanauma.jpg",
      by: "Diego Delso",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Hanauma_Bay,_Oahu,_Hawaii,_USA2.jpg"
    }
  ],
  a_kaikanani: [
    {
      url: "./assets/photos/a_kaikanani-1.jpg",
      by: "SNORKELINGDIVES.COM",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Snorkeling_at_Molokini_Crater,_Maui.jpg"
    },
    {
      url: "./assets/photos/a_kaikanani-2.jpg",
      by: "Bossfrog",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Molokini-crater-maui.jpg"
    }
  ],
  a_kapalua: [
    {
      url: "./assets/photos/a_kapalua.jpg",
      by: "James Brennan Moloka\u2026",
      lic: "CC BY 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Oneloa_Bay_Maui,_near_Kapalua_James_Brennan_Molokai_Hawaii_-_panoramio.jpg"
    }
  ],
  a_kayak: [
    {
      url: "./assets/photos/a_kayak.jpg",
      by: "Vlad & Marina Butsky",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Snorkelers_with_sea_turtle_(Kahaluu_Bay).jpg"
    }
  ],
  a_kualoa: [
    {
      url: "./assets/photos/a_kualoa.jpg",
      by: "Famartin",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:2021-10-06_10_35_10_View_west_up_Ka%CA%BBa%CA%BBawa_Valley_from_Hawaii_State_Route_83_(Kamehameha_Highway)_near_Ka%E2%80%98%C5%8C%E2%80%98Io_Point_on_Oahu,_Hawaii.jpg"
    }
  ],
  a_lanikai: [
    {
      url: "./assets/photos/a_lanikai.jpg",
      by: "MahaloMichael",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:KH6ML_Mokulua_Sunrise_from_Lanikai_Pillbox.jpg"
    }
  ],
  a_makapuu: [
    {
      url: "./assets/photos/a_makapuu.jpg",
      by: "Aaron Zhu",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Makapuu_Point_Lighthouse,_Oahu,_Hawaii_-_panoramio.jpg"
    }
  ],
  a_manoa: [
    {
      url: "./assets/photos/a_manoa.jpg",
      by: "Carol miranda of Themirandaroute",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Manoa_Falls_trail.jpg"
    }
  ],
  a_northshore: [
    {
      url: "./assets/photos/a_northshore.jpg",
      by: "AK KAMEDA PHOTOS",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:The_Eddie_Aikau_Big_Wave_Invitational,_Waimea_Bay,_Oahu,_Hawaii.jpg"
    }
  ],
  a_secretisland: [
    {
      url: "./assets/photos/a_secretisland.jpg",
      by: "kent",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Chinaman%27s_Hat..jpg"
    }
  ],
  a_sunsetcat: [
    {
      url: "./assets/photos/a_sunsetcat.jpg",
      by: "Alan Light",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Waikiki_Beach_sunset.jpg"
    }
  ],
  a_turtlecanyon: [
    {
      url: "./assets/photos/a_turtlecanyon.jpg",
      by: "National Marine Sanctuaries",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:HIHWNMS_Turtle_Cleaning_Station-_Oahu_Hale%CA%BBiwa_Ali%CA%BBi_Beach_(49530937986).jpg"
    }
  ],
  a_waianapanapa: [
    {
      url: "./assets/photos/a_waianapanapa.jpg",
      by: "dronepicr",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Waianapanapa_black_sand_beach_Maui_Hawaii_(31869652128).jpg"
    }
  ],
  h_grandwailea: [
    {
      url: "./assets/photos/h_grandwailea.jpg",
      by: "Dave Dugdale",
      lic: "CC BY-SA 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Grand_Wailea_Resort_on_Maui_(8528532630).jpg"
    }
  ],
  h_hilton: [
    {
      url: "./assets/photos/h_hilton-1.jpg",
      by: "Li Yang ly0ns",
      lic: "CC0",
      page: "https://commons.wikimedia.org/wiki/File:Hilton_Hawaiian_Village_Waikiki_Beach_Resort,_Honolulu,_United_States_(Unsplash).jpg"
    },
    {
      url: "./assets/photos/h_hilton-2.jpg",
      by: "gbern3",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Hilton_Hawaiian_Village.jpg"
    }
  ],
  h_hyatt: [
    {
      url: "./assets/photos/h_hyatt.jpg",
      by: "Fjmustak",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Rainbow_Hyatt_Regency_Waikiki.jpg"
    }
  ],
  h_kalai: [
    {
      url: "./assets/photos/h_kalai.jpg",
      by: "Simon_sees",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Trump_Waikiki_(19366309459).jpg"
    }
  ],
  h_moana: [
    {
      url: "./assets/photos/h_moana-1.jpg",
      by: "Peaceray",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Moana_Surfrider,_A_Westin_Resort_%26_Spa,_Waikiki_Beach_(1).jpg"
    },
    {
      url: "./assets/photos/h_moana-2.jpg",
      by: "DestinationFearFan",
      lic: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Moana_Surfrider,_A_Westin_Resort_%26_Spa,_Waikiki_Beach.jpg"
    },
    {
      url: "./assets/photos/h_moana-3.jpg",
      by: "Tony Webster",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Hawaii_Hotel_-_Moana_Surfrider,_A_Westin_Resort_%26_Spa,_Waikiki_Beach.jpg"
    }
  ],
  h_sheraton: [
    {
      url: "./assets/photos/h_sheraton-1.jpg",
      by: "Coolcaesar",
      lic: "CC BY 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Sheraton_Waikiki_from_Waikiki_Beach.jpg"
    },
    {
      url: "./assets/photos/h_sheraton-2.jpg",
      by: "Prayitno / Thank you for (12 millions +) view",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Sheraton_Waikiki_Hotel_(15133175013).jpg"
    },
    {
      url: "./assets/photos/h_sheraton-3.jpg",
      by: "kajikawa",
      lic: "CC BY 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Sheraton_Waikiki_Hotel_-_panoramio.jpg"
    }
  ],


  // Properties with no photograph of their own under a reusable licence. An
  // `area` entry is the setting, not the building, and the card says so on the
  // photo — a stock beach passed off as the room you are booking is a lie.
  h_airbnb: [
    {
      url: "./assets/photos/h_airbnb.jpg",
      by: "nick hoke",
      lic: "CC BY 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Wailea,_Maui_Ulua_Beach_-_panoramio.jpg",
      area: "Wailea"
    }
  ],
  h_kiheiakahi: [
    {
      url: "./assets/photos/h_kiheiakahi.jpg",
      by: "dronepicr",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Kamaole_Beach_Park_Kihei_Maui_Hawaii_(45015503264).jpg",
      area: "K\u012bhei"
    }
  ],
  h_tikitiki: [
    {
      url: "./assets/photos/h_tikitiki.jpg",
      by: "nick hoke",
      lic: "CC BY 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Elua_Beach_Sunset,_Maui_-_panoramio.jpg",
      area: "Wailea"
    }
  ],
  h_acwailea: [
    {
      url: "./assets/photos/h_acwailea.jpg",
      by: "Forest and Kim Starr",
      lic: "CC BY 3.0 us",
      page: "https://commons.wikimedia.org/wiki/File:Starr-170222-0871-Cocos_nucifera-coast_beach_umbrellas-Wailea_Coastal_Walk-Maui_(33380936095).jpg",
      area: "Wailea"
    }
  ],
  h_fourseasons: [
    {
      url: "./assets/photos/h_fourseasons.jpg",
      by: "Neeta Lind",
      lic: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Spago_in_Maui_Interior.jpg",
      note: "Spago, inside the resort."
    }
  ],
  h_andaz: [
    {
      url: "./assets/photos/h_andaz.jpg",
      by: "Forest and Kim Starr",
      lic: "CC BY 3.0 us",
      page: "https://commons.wikimedia.org/wiki/File:Starr-160517-0278-Cocos_nucifera-path_to_beach-Wailea_Coastal_Walk-Maui_(27335709245).jpg",
      area: "Wailea"
    }
  ],
  h_twinfin: [
    {
      url: "./assets/photos/h_twinfin.jpg",
      by: "hh oldman",
      lic: "CC BY 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Aston_Beach_Hotel_-_panoramio.jpg",
      note: "The property under its former name, the Aston Waikiki Beach Hotel."
    }
  ],
  h_outrigger: [
    {
      url: "./assets/photos/h_outrigger.jpg",
      by: "Fuzheado",
      lic: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Outrigger_Reef_Waikiki_Beach_Resort.jpg"
    }
  ]
};
