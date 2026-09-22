import { describe, expect, it } from "vitest";
import { getVivekPointsInSequence } from "./guide-content";
import { MAST_STATUS_THEME, MAST_TYPE_THEME } from "./mast-theme";

describe("guide presentation data", () => {
  it("uses the Training 4 sequence for the nine vivek points", () => {
    const points = getVivekPointsInSequence();
    expect(points.map((point) => point.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(points.map((point) => point.title)).toEqual([
      "પ્રકૃતિ માહિતી છે, લેબલ નહીં",
      "કોઈ પ્રકૃતિ ચડિયાતી કે ઊતરતી નથી",
      "દેખાતું વર્તન હંમેશાં મૂળ પ્રકૃતિ જ હોય એવું નથી",
      "સ્થળ અને સંજોગ પ્રમાણે વર્તન બદલાઈ શકે",
      "વ્યક્તિમાં ચારેય રીતો જુદા પ્રમાણમાં હોઈ શકે",
      "MAST સ્વીકાર માટે છે, અસ્વીકાર માટે નહીં",
      "પૂ. સંતે પહેલાં પોતાના ચશ્મા ઓળખવા",
      "પ્રકૃતિ પોતાની ભૂલનું બહાનું નથી",
      "આજ્ઞા, સમર્પણ અને શીખવાની તૈયારી પ્રકૃતિથી ઉપર છે"
    ]);
  });

  it("keeps MAST type colours distinct from one another", () => {
    expect(new Set(Object.values(MAST_TYPE_THEME).map((theme) => theme.accentHex)).size).toBe(4);
    expect(MAST_TYPE_THEME.M.accentHex).toBe("#b45309");
    expect(MAST_TYPE_THEME.A.accentHex).toBe("#b91c1c");
    expect(MAST_TYPE_THEME.S.accentHex).toBe("#047857");
    expect(MAST_TYPE_THEME.T.accentHex).toBe("#4338ca");
  });

  it("keeps validation and service outcomes out of the MAST type palette", () => {
    expect(MAST_STATUS_THEME.valid.badge).toContain("teal");
    expect(MAST_STATUS_THEME.invalid.badge).toContain("violet");
    expect(MAST_STATUS_THEME.matched.badge).toContain("sky");
    expect(MAST_STATUS_THEME.notMatched.badge).toContain("slate");
  });
});
