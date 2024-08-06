function delay(milionSecond: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milionSecond);
  });
}

export default delay;
