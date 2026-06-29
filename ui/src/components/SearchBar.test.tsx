import { fireEvent, render, screen } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("does not auto-search while typing; searches on button click", () => {
    const onSearch = jest.fn();
    const onChange = jest.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
        onSearch={onSearch}
      />,
    );

    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: "apple" },
    });
    expect(onChange).toHaveBeenCalledWith("apple");
    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("searches on Enter", () => {
    const onSearch = jest.fn();
    render(
      <SearchBar value="apple" onChange={() => undefined} onSearch={onSearch} />,
    );
    fireEvent.keyDown(screen.getByLabelText(/search products/i), {
      key: "Enter",
      code: "Enter",
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
