# ShieldQuest expansion artwork

Each district has a 640×360 opaque day painting and a geometry-matched night painting. The canvas draws them at 2×, the same scale as the original street. The approved street and town overview files are used as references and remain in their original paths.

PixelLab MCP `create_image_pro` took `scenes/street-day.png` as its style reference and `scenes/town-overview.png` as its architectural reference. The SUNhub painting carries over the curved storefront and signage from the existing overview at the closer gameplay scale. Tools used were `get_balance`, `get_upload_url`, `create_image_pro`, and `get_image`.

| Day asset | PixelLab job ID | PixelLab asset ID |
| --- | --- | --- |
| `estate-day.png` | `6fcc2384-4f8a-4046-8b87-b6a08fd772d4` | `d3d9fdf3-8311-5db6-8040-8163175656cb` |
| `mall-day.png` | `cc975501-f1ee-4f0b-9503-0cfe7b4de4d8` | `eb8e25d6-b1ab-59b0-8e55-cf02a1e2e84e` |
| `market-day.png` | `823465e1-4359-47ac-a531-ae197d43cf2b` | `0fd15ae0-f8a1-53f3-a45e-4570d5e83990` |
| `transport-day.png` | `b8059bc4-de7e-4a21-a29c-06b60e3fd0ac` | `211913ac-f888-5dec-a966-94381482ffd0` |
| `park-day.png` | `e37e99fc-036d-4f6b-ab45-10682a09520e` | `d076c613-0e6c-5f64-81ed-d6b91cb0b601` |

Six jobs used 150 plan generations. The alternate SUNhub candidate (`11e466a8-e4b3-4919-8a4d-729b7fb92754`) remains in PixelLab. The plan balance moved from 1,443 to 1,293 generations.

Night paintings are reproduced with `python scripts/relight-expansion.py` and Pillow. Lighting masks are traced over windows, signs and pools of light. The night paintings share the day paintings' pixel locations, dimensions, collision and occlusion geometry.

The routes connect the residential linkway and park connector to the bus bay, SUNhub, and market before returning to Blk 260. Reference material includes the supplied photographs, the [HDB Ang Mo Kio Town Design Guide](https://www.hdb.gov.sg/-/media/about-us/our-role/plan-and-design-towns/town-design-guides/Ang-Mo-Kio-Town-Design-Guide.pdf), [HDB's Ang Mo Kio Town Centre guide](https://www.hdb.gov.sg/managing-my-home/living-in-my-community/exploring-my-neighbourhood/explore-my-town), and the [NParks Ang Mo Kio Town Garden West Park Connector](https://pcn.nparks.gov.sg/explore-park-connectors/ang-mo-kio-town-garden-west-pc/).
