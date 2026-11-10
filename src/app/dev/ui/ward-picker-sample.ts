import type { Ward } from "@/lib/api/types";

// Fake wards for the ward picker preview in `/dev/ui`: fixed objects typed with the API's `Ward`,
// no network call and no randomness. They hold what the picker has to handle: the same word with
// two tone mark spellings ("Hoà" and "Hòa", which the API really mixes), names that start with
// `Đ`, and enough rows (36) for the list to scroll. The codes are made up and never go to the API.

const ROWS: readonly (readonly [code: string, name: string])[] = [
  ["90001", "Đặc khu Côn Đảo"],
  ["90002", "Phường An Bên"],
  ["90003", "Phường An Đông"],
  ["90004", "Phường Bến Nghé"],
  ["90005", "Phường Bến Thành"],
  ["90006", "Phường Bình An"],
  ["90007", "Phường Bình Hoà"],
  ["90008", "Phường Bình Hòa"],
  ["90009", "Phường Bình Tân"],
  ["90010", "Phường Cầu Kiệu"],
  ["90011", "Phường Cầu Ông Lãnh"],
  ["90012", "Phường Chánh Hưng"],
  ["90013", "Phường Chợ Lớn"],
  ["90014", "Phường Hiệp Phú"],
  ["90015", "Phường Hoà Hưng"],
  ["90016", "Phường Hòa Thạnh"],
  ["90017", "Phường Linh Xuân"],
  ["90018", "Phường Phan Rang"],
  ["90019", "Phường Phú Nhuận"],
  ["90020", "Phường Phú Thọ Hoà"],
  ["90021", "Phường Phú Thọ Hòa"],
  ["90022", "Phường Tân Bình"],
  ["90023", "Phường Tân Định"],
  ["90024", "Phường Tân Phú"],
  ["90025", "Phường Tân Sơn Hòa"],
  ["90026", "Phường Tăng Nhơn Phú"],
  ["90027", "Phường Thủ Dầu Một"],
  ["90028", "Phường Thủ Đức"],
  ["90029", "Phường Vĩnh Hội"],
  ["90030", "Xã Bình Chánh"],
  ["90031", "Xã Cần Giờ"],
  ["90032", "Xã Củ Chi"],
  ["90033", "Xã Hóc Môn"],
  ["90034", "Xã Nhà Bè"],
  ["90035", "Xã Tân An Hội"],
  ["90036", "Xã Thạnh An"],
];

export const SAMPLE_WARDS: readonly Ward[] = ROWS.map(([code, name]) => ({
  code,
  name,
  provinceCode: "99",
  provinceName: "Thành phố Mẫu",
}));

// A ward the samples start with, and a code the catalog does not have.
export const SAMPLE_CODES = { benThanh: "90005", unknown: "99999" } as const;
