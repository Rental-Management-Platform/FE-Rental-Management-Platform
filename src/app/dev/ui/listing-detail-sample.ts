import type { PropertyZoneData } from "@/features/listing-detail/components/property-zone";

// Fake properties for the "Nhà trọ" zone of the listing page in `/dev/ui` (scope #11): fixed
// objects typed with the zone's own type, which is a part of the API's property, with no network
// call and no randomness. The names, addresses and prices are made up. The fees are in the order
// the API gives them (electricity, water, internet, parking, service, other) and the amenities are
// sorted by name, as `GET /listings/:slugCode` answers (api-for-frontend.md, 6.17 and 6.20).

const HOA_HONG = {
  name: "Nhà trọ Hoa Hồng",
  fullAddress: "12 Trần Quang Khải, Phường Tân Định, Thành phố Hồ Chí Minh",
};

/** All six kinds of fee: one free, four with a note, and one note close to the 100 character limit. */
export const PROPERTY_FULL: PropertyZoneData = {
  ...HOA_HONG,
  fees: [
    { kind: "electricity", price: 3800, unit: "per_kwh", note: null },
    { kind: "water", price: 20000, unit: "per_m3", note: "Tính theo đồng hồ" },
    { kind: "internet", price: 0, unit: "per_month", note: null },
    {
      kind: "parking",
      price: 100000,
      unit: "per_vehicle_month",
      note: "Xe máy, xe đạp không tính",
    },
    {
      kind: "service",
      price: 150000,
      unit: "per_person_month",
      note: "Gồm rác và vệ sinh hành lang",
    },
    {
      kind: "other",
      price: 50000,
      unit: "per_month",
      note: "Phí bảo trì thang máy và máy bơm, thu cùng tiền phòng vào ngày mùng 5 hằng tháng, có biên nhận đủ",
    },
  ],
  amenities: [
    { key: "balcony", name: "Ban công" },
    { key: "kitchen", name: "Bếp" },
    { key: "parking", name: "Chỗ để xe" },
    { key: "furnished", name: "Có nội thất" },
    { key: "loft", name: "Gác lửng" },
    { key: "washer", name: "Máy giặt" },
    { key: "air_conditioner", name: "Máy lạnh" },
    { key: "elevator", name: "Thang máy" },
    { key: "fridge", name: "Tủ lạnh" },
    { key: "wifi", name: "Wifi" },
  ],
};

/** Fees and no amenity: the zone ends after the fees. */
export const PROPERTY_FEES_ONLY: PropertyZoneData = {
  ...HOA_HONG,
  fees: [
    { kind: "electricity", price: 3500, unit: "per_kwh", note: null },
    { kind: "water", price: 100000, unit: "per_person_month", note: null },
  ],
  amenities: [],
};

/** Amenities and no fee: the fees part is left out, the amenities keep their hairline. */
export const PROPERTY_AMENITIES_ONLY: PropertyZoneData = {
  ...HOA_HONG,
  fees: [],
  amenities: [
    { key: "air_conditioner", name: "Máy lạnh" },
    { key: "wifi", name: "Wifi" },
  ],
};

/** No fee and no amenity, and a very long name: the name and the address alone. */
export const PROPERTY_BARE: PropertyZoneData = {
  name: "Nhà trọ sinh viên Hoa Hồng cơ sở 2 gần Đại học Sư phạm Kỹ thuật",
  fullAddress:
    "Hẻm 245/12/8 Nguyễn Thị Minh Khai nối dài, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh",
  fees: [],
  amenities: [],
};
