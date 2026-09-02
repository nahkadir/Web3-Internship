interface SubheadingProps {
  left: string;
  right: string;
}

const Subheading = ({ left, right }: SubheadingProps) => {
  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto mt-8 flex w-full max-w-7xl items-center justify-between gap-4 px-4">
        <h3 className="text-h3-mob md:text-h3 font-bold">{left}</h3>
        <span className="text-p-mob md:text-p hidden text-gray-500 sm:flex">
          {right}
        </span>
      </div>
    </div>
  );
};

export default Subheading;
