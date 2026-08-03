export type Photo = {
  id: string;
  src: string;
  alt: string;
  aspect: string;
  title: string;
  location: string;
  year: string;
  category: "Nature" | "Objects" | "Monochrome" | "Urban";
};

export const photos: Photo[] = [
  {
    id: "1",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqs37aBkPsE8jd2T3JgJlZQoigK7KDI3k9f4eOntIfnXlRsU7SqDaA-8T_6iKcLVuTEYosLcikJ7tInMx4mg7NhQDl89iN5SheK86gts9eOuvDkKpBTAD8lC-x39iNyxadkoGjeBksJyp-N3CMjQml0GnlsabYssKca3kVj2DLl_D2bUnLTpH6IF_ScVD3-cwOu9pINS9T4jur6rYG2KT3CbBM4UVXVO3OFnkDVTqmWhlf7eGODdAx",
    alt: "A striking portrait-oriented architectural photograph capturing the austere geometry of a modern brutalist building. Shot in cinematic, moody lighting with deep shadows and high contrast, evoking a somber, silent atmosphere. The concrete textures are highly detailed, set against a dark, cloudy sky. The overall color palette leans heavily into monochromatic grays and charcoal blacks, aligning perfectly with a premium dark-mode aesthetic.",
    aspect: "aspect-[2/3]",
    title: "Brutalist Geometry",
    location: "London, UK",
    year: "2023",
    category: "Urban"
  },
  {
    id: "2",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAo3u7bnMhaQZf4FArGoF6b1i7NfJx9PbO6cfcjBOrcOtXExevBY7_cgGKPVK6t-RRZ2_Ms5qTBlN3npSFdoGECSTLkUphITZRs8DWyd8kI3EFXPROLzStwunJutqqLY2NwsSdk-0uOnU0vS-vIDcJwqqinbgj7Dl1tiiiKUUiWUgwNvzAGJdK2QyH0pJeb7Ul7kCRx3tux0stJtQOayJ2Hb8729Ltv9pQvvsABeYRg2N9oxeMahHAR",
    alt: "A cinematic, wide-angle landscape photograph of a dense, misty forest at twilight. The scene is shrouded in atmospheric fog, with silhouetted pine trees fading into the darkness. A single, subtle sliver of moonlight pierces the canopy. The color grade is cool and desaturated, utilizing deep navy blues, forest greens, and obsidian blacks to create a quiet, tactile, and immersive visual experience fitting for a high-end editorial portfolio.",
    aspect: "aspect-[16/9]",
    title: "Misty Forest",
    location: "Nordic Coast",
    year: "2022",
    category: "Nature"
  },
  {
    id: "3",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTeYDkyMeWJbn4TjVfRUmjSNwU_wasjo7Sg6YMObW45eKQo-nNjtDLYDoy9s4rva0vvw4DhSxo2OU7QF_7V-LZ0lkRsPhOytF1GRj0oZeLxoxI16Aj3jgQu9HtSviYp0eKyMYxWRRhg9wR-QT4Nj0Xyz-ZZMk8P8CywcWNmSF0IvkMAyvzGJArak3OIZSo5Dyh0I7V1Y1N-RbmVGFtIPKMng4ctyP-au6wnvibQ5N7svFY9CvaOy-I",
    alt: "An ultra-minimalist still life photograph of a single smooth, dark river stone resting on a piece of frosted glass. Shot from a top-down perspective with soft, diffused top-lighting that highlights the tactile texture of the stone and creates subtle, liquid-like reflections on the glass surface below. The background fades seamlessly into pure black (#0A0A0A), emphasizing the object's solitary elegance and refined, gallery-quality composition.",
    aspect: "aspect-square",
    title: "River Stone",
    location: "Studio",
    year: "2023",
    category: "Objects"
  },
  {
    id: "4",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDajlfWjzJp-zHDNqsmDkoJCBm2sfIwTeFtSi1TcRGNHZT1i5H7AaftrWfUdL-rDVAB0FxldfVZOzb_MrYIL6lozB4yaSwRGvuIr7mYzMwiwqooQ6mkY_v539h60x71_KJkz34TcWy1vjE0f2ZDqiDV9N81vHq2Dbig2h5oL9sGxpkKED37R2bHD40Tw_eo-DxJlkA3JOLItQugvIt41poh4tupsl_EMfafNBjcmkuHsP2ELXNWZcEr",
    alt: "A dramatic black and white street photography portrait of a solitary figure walking through a narrow, rain-slicked alleyway at night. The lighting is harsh and directional, creating stark chiaroscuro effects and deep, impenetrable shadows. The reflections on the wet cobblestones add a cinematic depth. The high-contrast monochrome treatment aligns seamlessly with a dark, sophisticated, and observant visual narrative.",
    aspect: "aspect-[3/4]",
    title: "Night Alley",
    location: "Tokyo, JP",
    year: "2024",
    category: "Monochrome"
  },
  {
    id: "5",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfrOooshWG2bGhjZmRe1h-0PLSzE4C3PFww7GkFhorkelSZRRpoc1PRLwC4dB8kmE4Yn-OpnyKxTIHKHf7g0mGzfXUQ0fPKbo_vJ7jdcKO3NDgDmyQoO5WaZVBspNLw369k9Bnl7nSodRwVW2gvoMB4pkQIltxFhDFmQwnt48JEUVI9QACwyasj-X_sXKY9rJZYVt7LZHlaoYBMkaBYtdBegkDE37o2GKhwYUVvFvrgKWa3WH6s31V",
    alt: "A refined, atmospheric capture of a coastal cliff edge plunging into a dark, churning ocean under an overcast sky. The image uses a slow shutter speed to render the water as a smooth, ghostly mist, contrasting with the sharp, jagged textures of the black volcanic rock. The mood is powerful yet deeply calm, utilizing a muted palette of dark grays, slate blues, and deep blacks to enhance the premium, immersive feel.",
    aspect: "aspect-[3/2]",
    title: "Coastal Cliff",
    location: "Iceland",
    year: "2021",
    category: "Nature"
  },
  {
    id: "6",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsOrIK_oa02smXw-NcWJjojoum-fEnhhxzPY7z1l183WtliInMFrOm_REYFYWMO4EpGE9UrV2cHQ2MvHCIKgnzJYlVLQQrNXU3qoIzYKqzq7V7TaIa2mXix_HaY5bUQrjDHxtFlo5cogZpSdVXzuvRBqIGc64RLf3wpDl17ET5bNkdbuy_oXBRvxDKRDW4Aejm7X8a2DldDzfJUhPBGqvS-tqx4bOsBLxUE3IP_b5iYkMrgJOpGE5r",
    alt: "A close-up, highly detailed photograph of abstract, layered glass planes illuminated by a thin strip of cool white LED light in an otherwise pitch-black room. The light catches the frosted edges of the glass, creating a physical manifestation of glassmorphism. The aesthetic is incredibly modern, sterile, and quiet, relying entirely on the interplay between pure light and total darkness to define the composition.",
    aspect: "aspect-[4/5]",
    title: "Glass Planes",
    location: "Studio",
    year: "2023",
    category: "Objects"
  },
  {
    id: "7",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjUrHBnGpvIQb4uOg9_XqQ0CppJLXkuP0ccnwWYB99PRpHOw4ks2m79sCkOP3apQFGzfQabsnkgtflMm5EGTGq8NaQPeqcKjnkpokregjwjg3SX_RxUSwsMvQ9b-X__GByo9nzDXWRo2Y_6dyBXXlv1Jxac5KKRWBqAPSYjiFqLkw5KUBQQDLwMwJ03Wrgk_1Zf2z1zWVDCdsQ6ZPgr3Ot7k0KIRzfnwwSqVydK8wzx5DiOX-hqr54",
    alt: "A minimalist macro shot of a solitary dried thistle plant against an absolute black background. The delicate, spiky textures of the plant are side-lit to create sharp, sculptural definition without revealing the light source. The extreme negative space (blackspace) around the subject gives it a profound sense of isolation and focus, fitting for a highly curated, quiet art gallery exhibition.",
    aspect: "aspect-square",
    title: "Dried Thistle",
    location: "Studio",
    year: "2024",
    category: "Nature"
  },
  {
    id: "8",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBt5KOpTkbMgU2KdAcY3AmyXs3v9yjne4tzdFrLg8RfTMdS3ljLHiyCtgsQHsd-YvHUfucJt69A13bUkFssjYxDI5xxSxZuEs32syuhs4z5FcQ0ATku1BEbLX9og9gNbODBjP-W0fJjfajh82yopWURQxqHRoKf-J42ia7CTUYxgMFw6uYSUp9LxPFfixtE822QI-3knVROdya79teUNpLjkqSBNJTMSH1nVzAzEWfiU8SRTvGB0RD9",
    alt: "An expansive, ultra-wide panoramic photograph of an empty, brutalist concrete plaza at dusk. The horizon line is perfectly centered. A single, small puddle reflects the fading ambient light, breaking the stark geometry. The color grade is deeply desaturated, focusing on the heavy, tactile presence of the concrete and the vast, oppressive emptiness of the space, invoking a cinematic and solitary emotion.",
    aspect: "aspect-[21/9]",
    title: "Concrete Plaza",
    location: "Berlin, DE",
    year: "2022",
    category: "Urban"
  },
  {
    id: "9",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5HqfTEKuZaru9M9CO3D0dey_uKwVGqlWy2OyB8im1X7TrCWqRJNe1qaR5qm3CHQibfwxi1rqpXAaty2iB3EMYug-Yr8iCmriyq3HNos2xrBsOE0xR3af60SwAG1Oi4Fsm7LxMzbNt62g_g38niy8NYEAQ4TSP6n--OhXp2H8IUS-I6X1CryGn_zbMdsOMY3c75KT-Zwp-OBgHtWVNweMVKHO_U5yNwyeAMiJkpZhMQqF5GawBEIWo",
    alt: "A moody, low-key portrait of a vintage mechanical watch face resting in absolute shadow, with only the slimmest crescent of light revealing the metallic edge and a portion of the dial. The macro detail highlights the brushed steel texture. The overwhelming dominance of deep shadows and black tones creates a feeling of timelessness and extreme luxury, matching a dark-mode editorial style.",
    aspect: "aspect-[2/3]",
    title: "Mechanical Watch",
    location: "Geneva, CH",
    year: "2023",
    category: "Objects"
  },
  {
    id: "10",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHQgBGXgkuLgyan__B3YASlg4AUfvBUvn44xlFzz2cMfMX0GeqfDne9yrm5UGrMOqYQacVSjGFXVMODEOQ9YNhPVLHh020XjvdcXI-qg259jfrCCZhLymc268ZisIQ-Ol1vWR9jBCPMqvsvrKqn5dhAmNopUS5hs5ULd1eVF3nt8xxJcuvz8_oaX3D3Bg96iy8cVIYDlxpNvku685ldnnDntYNvq3igKA9rkHM3MySpT8sjGnLs3bS",
    alt: "A striking digital installation art piece featuring glowing, generative geometric shapes suspended in a vast, minimalist gallery space.",
    aspect: "aspect-[3/4]",
    title: "Urban Silence",
    location: "Oslo, NO",
    year: "2024",
    category: "Urban"
  },
  {
    id: "11",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgAC60DKJ4tOZlRWj-vRon1I72QOjRFauxfxBIhdAlroi6WjjBWLcoOZXC-AlBKjCLAqLEapCaJCJLH68jJJnMVbXXuz_R-iO86qv_b5A-hcRI5Mloc--oYX4GXL5lVzMcwNkFUD5ayX_FFl41kOVTjPGTrcoMlepPKKLfuo9T1_nMJsGf3WvvcflOcN7loQYu-fqPiRPnf94QlHVtvKrJt-4Hmw9-RWXab6f86vlo-Lr3l2s33Xby",
    alt: "Nordic Coast seascape",
    aspect: "aspect-video",
    title: "Nordic Coast II",
    location: "Nordic Coast",
    year: "2023",
    category: "Nature"
  },
  {
    id: "12",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBT0_w77T7y30_fqNaiG4_izGva69EswbKYM65r9jE1XLcHekJv9It3bslzW6oEtyqTPRFkmZB16aZqTi1-RW4sEVSJnNhyqL7IBJ378_rWgaGMv8X_6IM1cy-mjWZjDOWjTRQBCNNyzayOCt_8eIh_TtpXcJyDkGu7IpIeyU-SYjCdImr-1uBhJJ9CJrPfYm7Cxcq2MCVeUMDjsnSBSHumRUV8IQSFGbcJEw8oCQknQW4noMtyBp3G",
    alt: "Texture Study I",
    aspect: "aspect-square",
    title: "Texture Study I",
    location: "Studio",
    year: "2024",
    category: "Objects"
  },
  {
    id: "13",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_wY8CGmww7h8FZeri5LEfTsLniUP0QAiFdiUqF2qZjn1uAjrnfdv6VfBK9g4-Z3ndJmxyyfLLoClE2PVCN9PNitRCSl498hx6rDGLdQlofv7YAhBTGmsPfjX2KJ1c3xrW6a9lBbnZKvcjGYCPsPCW6DLmrCPBmngIl7W7Hr-kegBERzufZA0zL2il9J6uOugquScNwhFWu4idUTMyvBDoIdxcNnwLpNiAWoqDlpp8GLlb_uHodr_S",
    alt: "Midnight Chrome",
    aspect: "aspect-[4/5]",
    title: "Midnight Chrome",
    location: "Studio",
    year: "2022",
    category: "Objects"
  },
  {
    id: "14",
    src: "https://lh3.googleusercontent.com/aida/AP1WRLt_p_3taNJFKaIPQ9dLhmTlbuIjeo-4Mdjwxse2woumL9J8YXATt7K8hd6we0SjhDdAByWT6bH_c3Ksfvp5A7jRMee1bxkAfjI0uaOHxbnKXii9cEOZ_Oy354DfKYAfxNL9wGCTmdu05hFGXQntOjXgZoOoYz3dLj7t7ZlJ0y5AG0pdt9wB2Dju5ZaqpVasI-9BrLEkCzh-wXtx5RxXpcNdi6IDR3HflyyhHzAyCf6V70Ux-Y_EbuPgavk",
    alt: "Silhouettes at Dusk",
    aspect: "aspect-video",
    title: "Silhouettes at Dusk",
    location: "Nordic Coast",
    year: "2021",
    category: "Monochrome"
  },
  {
    id: "15",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D",
    alt: "Photographer portrait",
    aspect: "aspect-[3/4]",
    title: "Self Portrait",
    location: "Oslo, NO",
    year: "2023",
    category: "Monochrome"
  }
];
