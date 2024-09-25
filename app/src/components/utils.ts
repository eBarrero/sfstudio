// utils.ts
export const handleKeyDown = ( e: React.KeyboardEvent<HTMLInputElement>,  onEnter?: (newCalue: string) => void ) => {
    if (!onEnter) return
    if (e.key === 'Enter') {
        e.preventDefault();
        onEnter(e.currentTarget.value);
      }
  };

  export const handleChanges = (e: React.ChangeEvent<HTMLInputElement>, onChangeValue?: (newValue: string) => void) => {
    onChangeValue && onChangeValue(e.currentTarget.value);
  }
  