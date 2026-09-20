import { requireElement } from './dom.js';

const WORKOUT_IMAGE_SOURCES = [
  'https://lh3.googleusercontent.com/pw/AP1GczPIj4FDDAnGuV7vTNyJ4G7GF98MVyefBUHpBFXCHRHnyiUWR6riy_QrVBMuoGPjLDDQom1ree-2wWeRSoqT8fDQrPHfQEurkFKmfQsr6tw1E7Qi1n9C',
  'https://lh3.googleusercontent.com/pw/AP1GczM5HVtUGjB4LzG57uJ98eXWiF_jw16Ozp6pp5R-vgJKYiZ2v7osCgg90lJQxcc7kPUOFSlyuvBAtyGsqOCkrSLRXjuV-hVeJQrb049pOsq5HUl_s-3h',
  'https://lh3.googleusercontent.com/pw/AP1GczNM_KvML9BUxc6teKxa8xRE9OqgcP_EM5EOkSFtNC6tQaBBj97rl3wr1zK1qxGoK6w8PFp4ioRyJKdNVOADvTYT_5O1GpWCI2ovRgt912uBjkxy6C0p',
  'https://lh3.googleusercontent.com/pw/AP1GczN459two3DtG6wp4AZtzKuvIBFBvHezIlLuapkXl_KsuubkBHgrrbA6RnjovExrD29TbgkQ12aVaLn9AR-gIpMeXC2fNHlc168XfUl-Qb6HXRZcWyT-',
  'https://lh3.googleusercontent.com/pw/AP1GczMc5jAKewPidrvk-Tq2wfZpgRXcpOYnmAr3UqyDJTt-UOygnsCPVWF6zCnFYR-k2d4JLTVdLSnOidZ67c4F3YptkrPXNLrDjpO4FWIIFc-u0v0QfSBu',
  'https://lh3.googleusercontent.com/pw/AP1GczMaJ_FVlgqH65d7aL8E1Zu42MC5WOyG79YW8YrjLY-XTqdDS6bCKquK3jvR9z7_3oOnpPeX791Id2joqkXMKKsxP1q87zzpCkybVLvthRcuUPyRA9NE',
  'https://lh3.googleusercontent.com/pw/AP1GczMiJK72oOLD1fiUEOgsxCLZy26dpInKMDJ6noncaVHGVFdZBHqRLcdYDrgEv-72BstLbBLF0A_QTYcAiDcZdUdh5UFjQkOBiniCzSeUUv_BAlw30b3y',
  'https://lh3.googleusercontent.com/pw/AP1GczM9ECpvYxtgqi_opGN0rOvu2f7dXMrfyLSEBh9HiFcr54XKbQI9DhRIYlWplaRhDzwEkdJWw38H3Dv1NXePGl_DBMlNytD8S2Plk_1GVW7tkt99IZLs',
  'https://lh3.googleusercontent.com/pw/AP1GczOGzVfrkD6h3K1q24mReYfmfTcqJCdEHF9QIpwPrTwdrbrVQ7nIgSG6mUMoknLVf-Q0CdfjqMKzKOC9FOPc8jTAxNEFg23bOQJyjSrybmjjj7DWOoqn',
  'https://lh3.googleusercontent.com/pw/AP1GczMynUJVELSonM0yQJZFAngz2dOdFJgguErAP-ix811hEgJNBsCVHloLWCJAoMKh5zq6IiBpxCSbrNazbL_AVziIlHO52hFWlPE4rkjJFnX36xlKPkLy',
  'https://lh3.googleusercontent.com/pw/AP1GczP0gDCVzIPUL_GwSqPt0zbFnyG0cvg1npxWE9KPfeR9YDd7Y6d0U-GabTnR_9zmDEoKMhB_srRq5VvKiGBmw-LAS6XBE9DgC_YB3H_RInV7xlW2Gp91',
  'https://lh3.googleusercontent.com/pw/AP1GczOblKfLKVCPE-vIlKdMZ8G4P4NREYKrLI5SOPDwuYKVgc1cBKlspgdl6odKMUcb6g28SV-kpHnIdKHHgeMUXyEBF0raAuiIIvdVsXaCEuhj0iI-8Cs6',
  'https://lh3.googleusercontent.com/pw/AP1GczN0y6VGO8fjoiTqUtWDHqND92iANS-XD30uAAPkOxpIPFWbOiPqIKBeLj4vlsxvXuPz661FDauqkeIO1RekfKHG01LMFRIX0wr_T6NPU_jBF5Na5E_k',
  'https://lh3.googleusercontent.com/pw/AP1GczOFAYhkh7lfXt_GYb4FsJBC-CzugEq_c82HGPP4XkTWgcToZaW7N6eEuwJNMlMw4rmFMuCDtUCdmdT27ZSrYnudennVz2iAm_1TUURBxxjEQV36sKj7',
  'https://lh3.googleusercontent.com/pw/AP1GczMIiJQQiGtIwalVi8BTBf6qOSFWFq9wa-_yKs14oyTtZDfQMR_GMUBYKeASE9l98ekuyKy3e_Xyg1jRsF9EY97uW1UBCW-Tdyl7asPnvs-zdOtTx9GP',
  'https://lh3.googleusercontent.com/pw/AP1GczOUGZ2KPZlrtAP_cwH2rJ8pHNakxdLgYj_fDedF8ipMiNtHJ8QWuBlV61ZYRBqdVQ-SPhFhdOmHaYABA17SlZMtOPmpz-HHjmp-nJZBbg4WSWFdPY7R',
  'https://lh3.googleusercontent.com/pw/AP1GczNopeIpj93wbxXOkPFpYwGbsVD2eOc96UeuzN3nwaPsivG0EfEy72PV2uH7Vvl8kLWTCAgHcJpgk5B3aotyIGDnbCnofYEesuxt-npBGSproeDaVV1c',
  'https://lh3.googleusercontent.com/pw/AP1GczMmuGaqjCiKz8dc1ZaY9IgiMO7k15GnJUGjhaL_oVtil-lu0wD5qpojuEF8UqgmYzBlNq56DNCJQoahtM5u_lI508i8lvdh28cgsQHUBFCkS--YCekn',
  'https://lh3.googleusercontent.com/pw/AP1GczM712DrdbjyiQ2LmLJN1Jpt0DQjKtjQ-B8WGy2sgDCvepFf1D_LA4HmVmdVrqr_3RtcD7aS0XIlu4d6HgpyUQv_n9R5u2o0WQuWwpxBSHlv7XLZ1EEk',
  'https://lh3.googleusercontent.com/pw/AP1GczPYIUTj5RI4YMx6C1FOncfxAvF2GhlZsoDMScmKDyzV5c1z9zH44Ucreip43lar1NNbdoT8HiZ1icL_cLOfKUb9BrJpOhzm-VT1Cv1tAr6257g9c4OW',
  'https://lh3.googleusercontent.com/pw/AP1GczNlP0g1NakFoi6PdNJcLewmSL4K46x_tx7qokj9AwCacG4-SWBywYGHsFBfoz8XCUP3QZCHUyGHLPeIZ4q83PTnoz2M3fn7DhPoUE2PIFL9mzXE54Fk',
  'https://lh3.googleusercontent.com/pw/AP1GczMQjjysnDvo_YBneHw9WPbjW02jk28FYqnDpyMLXy1LNLUjA2HWtdEcD7XyxifZYQXjifHGbKj7Q6N1-Q7ylSU87To3xm_aAkHdDJl7_TQm2odrKMHY',
  'https://lh3.googleusercontent.com/pw/AP1GczNAo3XhnT8UJfsdv-d5yeGZ_0wf3nUdls17cKivLhjhrpXTuNz_o3l2WfN5-GLYNUrdLItOne8PM3tO90rDhH9GB-oxtGomiQVD3Gol8lPgGXsCTCeI',
  'https://lh3.googleusercontent.com/pw/AP1GczMHvhYWIx8iDaO0QwUNcMAqugGlXX0eMT2qyFNgS0lmZmUddILlWPu1D0JVPWxRRvyARsT4aYo1k_VQLW-18iRYCrYzoeL4WjiRY56e3RsepGphSHt1',
  'https://lh3.googleusercontent.com/pw/AP1GczNx8n-lMDqYUdLWCW4SVd2rWgklMV5DP3Bl-oV3F0y94dORAIgvleSdojEEsfvmEz1iwKR0gMfOD-6RDGgvTlCdfdWVxr_30h4RYiCmZbbVtlBBVwy5',
  'https://lh3.googleusercontent.com/pw/AP1GczOZQkm63AYQZp2VUQklMFp43DIPk1Uyc_ZF0auOaUtp3Y8090teY4iTl_9XT6ircsZKPvLhyw3UgT5E7gVLEkIbisudr-iOpWLbQtX8oUjSr2_bgRwD',
  'https://lh3.googleusercontent.com/pw/AP1GczO2Zf7Ukw2eulc_dDXrSjcDM3_vF1iVeOdsLF_JsVuDRZlMrmvsbRRfwmgP7tvRRbmKKWP5MXCnf0GodV-z7hasmqhaeH1N3n5EwnDc8r6CLKdhYEfh',
  'https://lh3.googleusercontent.com/pw/AP1GczP4kgZXtDM7V7j4iOhIZ03kbNrQ1hASVfUz6VJasLun1vXyCFwp47x9gB-iRqwo1KHJlU4xYCcOc5lm-Gkm6qtapUi4dHh_PJYMcXfq6cLYZdizjELF',
  'https://lh3.googleusercontent.com/pw/AP1GczPkNP58bICsXbWBzkzvUZuLJFVVbIYhSgGxHJRDJPg7UVE5uRDhGqlCdYZwZpgQ_oSQk8wfvVKkH6hf46UQGSYSGmEAbf869pIPoHG7N6XHyRcdinn-',
  'https://lh3.googleusercontent.com/pw/AP1GczMGAHJAZD88uKNKJMokPoBaD3pPiba0n_cioO0Qq4Xk8awJ9FP5WWu_XxWnenLpBIo3nzsGmMzGLhYvnpz7VG7VWfXBTiECTdCL_KNgvYVcFg-HDa_J',
  'https://lh3.googleusercontent.com/pw/AP1GczNz8AtauWZ6MtxKXMYFyR3fz0na1ihskrtR9S7P-WXuyAincdkhHJLk-Cgo7TlQa_lb4iASn037pDRFSrmjMNqTvs75Qq5R9oN07EsLUkDdsnVsV5CJ',
  'https://lh3.googleusercontent.com/pw/AP1GczPjQ4CvX8B_wKo9dmOFCwjwMzL8sWwEKFPRaYOni3n_cd-mDhr2NMrkjINK1mwsr08W4F6QB3RfTrmuV6JDEFTesfJ7xTsDFpx2L9flQjJ4zf5m2Kl8',
  'https://lh3.googleusercontent.com/pw/AP1GczPuuifYVw_ibTiYZiMVOPjD-k8jAu51u870-l9hYFymV7-Vts0RD87JP9s8RIuyo4G_fn2YrDUMMMbVMpjua3k2jZewZ7SUhV5FHeZ2zILjRUhhFgBy',
  'https://lh3.googleusercontent.com/pw/AP1GczPiOJ7et9snkNUvPq3oQAOqGswElvf-Haqp6fJ44Bgqt_mbNSRTlljkyqelYF_7jQm3O4jjUYfajy1ybflZjnOacG8LPsX9um2XCRrNo4Bt3iMPaKCj',
  'https://lh3.googleusercontent.com/pw/AP1GczO_g7TWvOFh1S6mIBalGh_eJZ1dp_Fah7xtmD-XSZB5zfqUA9bSZH-HsRgsMS-_RjKWw_8tdc8QJXC7Von3tpWyCE2Yp8MHDN4LCid5wGYow_RxnBwi',
  'https://lh3.googleusercontent.com/pw/AP1GczM7DhJet_U57XpnrG7qXD1Q7D1NluN4dgNG2AGokcpgkwNj8TF05UNDMp6UX_55zRqWlDASr1s-gGWabtSB2-0WLml3AS1GPgGTE1uI6-Aq7pmVXX36',
  'https://lh3.googleusercontent.com/pw/AP1GczNpY0VKoTN1-jyW6WBYCLtROjIW_5fN7KfBRJbMP5x_XLmMZxR7w3oIO51_8qhsnFHfBIFjV-DZZ870Tm3Ce2QYLYGX82qjH12q8O-WB4AC6Mp1az8m',
  'https://lh3.googleusercontent.com/pw/AP1GczNfoRurdJubOYMiOyePlq9d7sKEyYqs4ToYF0XSch-CNkP3NuPotpKuunaiiNJsz2XPQH1kRDbLUSyKq0R8BZOusuYhGX402Wt645KMZoVcZyags_lh',
  'https://lh3.googleusercontent.com/pw/AP1GczOPauf9QN4W3CLyuXyYFS49kGmQwXlcVtLXeOn4I4SsdLSCRlKtHetaDXfPSPjxAxhuno80p5NH1W01nIHCojrKz6CDHSpDxqD04rIUfKwqeCVsT7qN',
  'https://lh3.googleusercontent.com/pw/AP1GczM2isd2mY0M0it9LkNYmMSwdqM1jdKWp5-A1jPCY9HzffyUJfBVa3QKdBYt0nKQHd7add9hw2kaUAIHTKrMCzGdiIZUW-31Y2NZq3Bv2egzFXEBfMw1',
  'https://lh3.googleusercontent.com/pw/AP1GczPD7g5u_4XUVPbUbzmnSIaPxpSm4YVjc1MOE7ijqFpbdGCvGJ33ajEEw68y_fiD9ABEIoaV9CxMCZq-kIekk4BaNc9ZZewZvaSJM9B9RLxp60yH8MNV',
  'https://lh3.googleusercontent.com/pw/AP1GczOZlDa3nycs3wKhOcbhn6dXDos0ZoIHyaIQgE6-Z32WIHQ6u36chgAbNDIAOHUtz4JSh5XOWwtz9mCg0V293TgGmr6STezb5kd7Jm3AphKgz--sw-Et',
  'https://lh3.googleusercontent.com/pw/AP1GczN2tHOcnS7VoYhJHk6vvC-CfLh1hHX9skYOfhhDUEJXKvTK4gaRcv6vfHNbQnw5nQG9XEzTRn65eVu0P_k01VXSCNghY_7xkRICNUuJhzhs2eO2pYfB',
  'https://lh3.googleusercontent.com/pw/AP1GczMSHAL2ch_-72CGf9y_L5CQnR4Aqxcf7fdJmmum2WP1JCHS4Gs-EWDHVaicwtMiLYFTPc4kMGUDRtbYqv6lOPUR0fIRCWsQ4Ngk5l2dIxfcRV8KJfXX',
  'https://lh3.googleusercontent.com/pw/AP1GczM1ZKeSiEtgnE_lad7CSxNs4T7l9nuPrTIS_ErQRa4in-H_RWXgfGGZ4Cnk9KBvUC_h2hfkIDNug8z9dIqtMtCS_MP61ST2vCLjf0T4ChcSAMEwCOSH',
  'https://lh3.googleusercontent.com/pw/AP1GczOACoHdqc9lfxUf-CfFAlr7T2vsJ-hBSbwP0_E3ndJTwWurEZmaifDAN12BKejuDg0i_SlalmJTDgCnyU8wv7iCDV7kI3C7L8LLFBg1K8lu92atykU1',
  'https://lh3.googleusercontent.com/pw/AP1GczPKTs0lPEvA6RWQCGg1Hc7auikynxcT7IblXNgkSkz-j7bbFOSPYdR2c16bGKCuq6i3ed63gMnW_jLM5sl7O7qXYITTmn-yG4P-OzRd4qymRJDpClpd',
  'https://lh3.googleusercontent.com/pw/AP1GczPPW9RpAMEAAYXQ7UorpHgnawE7Zy55cEKKt5Bx6hMPAdWkwa_g86k8MWDtYsBc3rAIkN8pxG8UixIaBgZ99Vk2y5-pXnN8LyIGNm41yVsHdC1gCpxN',
  'https://lh3.googleusercontent.com/pw/AP1GczOXq59CUnDuJhL4AwrALsvg4y_HI3PuJZK9U6jbdKHjEp1qzTlmcXzL30wyoqU755IAHvhrb7VkiJZpZyfbNhUedXp_hiEOFO1xIiWcaleYJAD2E-Js',
  'https://lh3.googleusercontent.com/pw/AP1GczNfDJr3d9IekyYK-2BJrYXFPzGhBeSoD-LyDJ1-hbmfxRb5lTLt8nhqlaCY9Lh7Hm5PAXy8pvKWG2WpcQBtW_RqzywsMTpkWDGdRs1Dllgg5eRp0ZXr',
  'https://lh3.googleusercontent.com/pw/AP1GczNkI2ftph_IPWH0fVdyRKqZ-ZaeISVM7sqnMXvY79MDggiyXfGA9W5xNFNwGJf8CYo0DnD_XKMqcqjdCrovNA4xbnFxMGTK99cYaNTJaWwP2gCIDVmD',
  'https://lh3.googleusercontent.com/pw/AP1GczOrCmXt0n7-x-yQow98XWpQtiCwhn_9UUbvldxp-84OOtPJac0PEQjAf6k9lpPwk5SSecByd7U7qfknJAS2jJTYu2QruXOkLbWG-qeEJq_cu5tbG1ML',
  'https://lh3.googleusercontent.com/pw/AP1GczNq_PoGV4TkmJLcajN25tF-2YSv6Mv9_UmcrpcC53Shh0aSHTiNV9ywhRw70kEfykWfCc9xRYw1pQPZ0uDN_qyYXJpenzjF8P2qcC_NLDutGKRjg4Hf',
  'https://lh3.googleusercontent.com/pw/AP1GczPZsTCXT9sOLivW6H-wEowhZgzrXyB-qq-NNKzAX1QdQ5hLFlXZ0bOR_QbTB0GJ6FZIC9qql-rg8Wf8kYyeJG8X_Cv4FZDYrvOoDNKQxrzwJqxEiv58',
  'https://lh3.googleusercontent.com/pw/AP1GczOpDqV-bg-Agu-xC7xEX7itlRFHUG-_4KiIkDEigWff2uYqUT8LvaiE9Ths9EMDPfx2AZk_ooWTagqsh_xQfLDI5f48EwkB4stvtpqtWE-P8Xd4KtcG',
  'https://lh3.googleusercontent.com/pw/AP1GczMBLUYPUxQxx7MFKN0BtvYlmdAiB39m5YHsPBeZAPQDYzDgiS5tIGaDPBOwdz9JMOgRwnn0N1Hv3kAIabevbH5_MW2kSAdId69VbAJ-RO2yTe2hgzFB',
  'https://lh3.googleusercontent.com/pw/AP1GczPbF83t2FJx5TlwDJe_J34fugGefvehr1mrqCGU6RrDVjcRsE0bIRu8FHjk-59UL-B6qCafX_eExuPpev_pKYu_vkLHIrWRP8we2xvYESEDujaE9ean',
  'https://lh3.googleusercontent.com/pw/AP1GczOV6Mz0EcGR1K-RKFOfCV1Bkvf1x9gELc9zb04_GZOdVXS3wayEjZr8rBQpDdE-SiVv648bMP8vv3rRBdmSqIWHHKr7uBaJIibA0U8ycfvVjELt6UCJ',
  'https://lh3.googleusercontent.com/pw/AP1GczOB2lhnsO2MMCuX9E-z4Pe1ymmivarE1V_i08sOAG8nanogaomvuY_3i8Q6avycsu93BJxj2BLFkWo1zlEpfvJ9PFfS0CFz018Za5IyTHoh9aYmzLL-',
  'https://lh3.googleusercontent.com/pw/AP1GczNBqlr2pQhWOEVh3EHcg0-MlKhPuqX5t3k4XDoe4PlAi1WIxUM4Ibnhf7j9xBy5S99NKAEg1mGn6C-hgWC9m7yjXuTUk0UkjSNkdBBMY5ObJjq6jHGX',
  'https://lh3.googleusercontent.com/pw/AP1GczPWoH9HzZotXMbrz6-eeoWgfMQ_Eh2DXUBQeNQ1OYUOpH0LkG-LGt2A1EHX-TCzZhOfMuFOK4RXi_LwPD4p5YfCM9WsbZyY13dm7UFGmOz7TGXMTA6R',
  'https://lh3.googleusercontent.com/pw/AP1GczO7wokhhQEjBZAs0AFHhkniAFJwrCOCVl1kt1Xl7R8cDw3TvM1X5_1zzwPqoUKCxtO_SkiqC4AalYMnNkXKZW5GyaytvW0C5AqAEPcir3WWqvjSAogd',
  'https://lh3.googleusercontent.com/pw/AP1GczNFEVDQoZkD-hslvJLZryPCOd34m-VmljWTUYlRIaE8ZJ1fLXZ3OXYehCe-Ikzw-pOpYfsrxvr31LkMSF0d6dkZlQCpJ07JzMCJwhCO4M0xMQeFLRox',
  'https://lh3.googleusercontent.com/pw/AP1GczMxIsuXVVSXFvnawKeeFbC61S6D0sYE_nfQWSUC7gJJyUBqoWG6Nnv69ACVWZltT-xe9riiYyiAvuwUTv9QajsLDAijjQMVftgrfpwS2-z5t-EZI17b',
  'https://lh3.googleusercontent.com/pw/AP1GczN1oSA8DPZplFNeXiwyJHjMpb7-Lzzf7tmRJpeL28s0WyNHG7hWrDD2wh8o0QUO8rqz_Fiv14PIH_OXVgTDcDWqm3ffNFabhjJ43Xtjz-v-L9EC9s_v',
  'https://lh3.googleusercontent.com/pw/AP1GczP5opSduWodxR9v3VB4ARASncjepqhXW3BUk6ASuOJETHcSpxjscnevasV81wPYdugHUnrt1pPG2KM7p91atcJqx19CZzWGtixkRu80v7kvckHFBA7d',
] as const;

const thumbnailSource = (source: string) => `${source}=w480-h360-c`;
const fullSource = (source: string) => `${source}=w1800-h1800`;

export class WorkoutGalleryController {
  private readonly panel = requireElement<HTMLElement>('#tim-workout-journal-panel');
  private readonly gallery = requireElement<HTMLElement>('#workout-gallery');
  private readonly closeButton = requireElement<HTMLButtonElement>('#tim-workout-journal-close');
  private readonly lightbox = requireElement<HTMLDialogElement>('#workout-lightbox');
  private readonly lightboxImage = requireElement<HTMLImageElement>('#workout-lightbox-image');
  private readonly counter = requireElement<HTMLElement>('#workout-lightbox-counter');
  private readonly lightboxClose = requireElement<HTMLButtonElement>('#workout-lightbox-close');
  private readonly previousButton = requireElement<HTMLButtonElement>('#workout-lightbox-previous');
  private readonly nextButton = requireElement<HTMLButtonElement>('#workout-lightbox-next');
  private currentIndex = 0;

  constructor(private readonly onClose: () => void) {
    this.buildThumbnails();
    this.closeButton.addEventListener('click', () => this.closePanel());
    this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    this.previousButton.addEventListener('click', () => this.showImage(this.currentIndex - 1));
    this.nextButton.addEventListener('click', () => this.showImage(this.currentIndex + 1));
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
    window.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  open(): void {
    this.panel.hidden = false;
    this.gallery.querySelector<HTMLButtonElement>('button')?.focus();
  }

  hide(): void {
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
  }

  private buildThumbnails(): void {
    WORKOUT_IMAGE_SOURCES.forEach((source, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View workout image ${index + 1} full screen`);
      const image = document.createElement('img');
      image.src = thumbnailSource(source);
      image.alt = `Workout ${index + 1}`;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      button.append(image);
      button.addEventListener('click', () => this.showImage(index));
      this.gallery.append(button);
    });
  }

  private showImage(index: number): void {
    this.currentIndex = (index + WORKOUT_IMAGE_SOURCES.length) % WORKOUT_IMAGE_SOURCES.length;
    this.lightboxImage.src = fullSource(WORKOUT_IMAGE_SOURCES[this.currentIndex]!);
    this.lightboxImage.alt = `Workout ${this.currentIndex + 1}`;
    this.counter.textContent = `${this.currentIndex + 1} / ${WORKOUT_IMAGE_SOURCES.length}`;
    if (!this.lightbox.open) this.lightbox.showModal();
  }

  private closeLightbox(): void {
    this.lightbox.close();
    this.gallery.querySelectorAll<HTMLButtonElement>('button')[this.currentIndex]?.focus();
  }

  private closePanel(): void {
    this.hide();
    this.onClose();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.lightbox.open && event.code === 'ArrowLeft') {
      event.preventDefault();
      this.showImage(this.currentIndex - 1);
    } else if (this.lightbox.open && event.code === 'ArrowRight') {
      event.preventDefault();
      this.showImage(this.currentIndex + 1);
    } else if (event.code === 'Escape' && this.lightbox.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closeLightbox();
    } else if (event.code === 'Escape' && !this.panel.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closePanel();
    }
  }
}

