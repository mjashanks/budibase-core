

export const getNewIndex = () => ({
    map:"return {...record};",
    filter:""
});

export const addNewReferenceIndex = recordNode => {
    const index = getNewIndex();
    index.name = "";
    recordNode.referenceIndexes.push(index);
    return index;
};