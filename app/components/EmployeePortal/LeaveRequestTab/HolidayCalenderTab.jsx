'use client';

import HolidayListTab from '../../HrModule/LeaveTab/HolidayListTab';

const HolidayCalenderTab = () => {
  return (
    <section className="w-full">
      <HolidayListTab hideAddButton={true} />
    </section>
  );
};

export default HolidayCalenderTab;
