const todoList=require("../todo");
const {all, markAsComplete, add}= todoList();

describe("Test of TodoList Suite",()=>{
    beforeAll(()=>{
        add({
            title:"test item",
            completed: false,
            dueDate: new Date().toISOString().slice(0,10)
        });
    })
    test("should add new todo",()=>{
        const listCount=all.length;
        add({
            title:"test item 2",
            completed: false,
            dueDate: new Date().toISOString().slice(0,10)
        });
        expect(all.length).toBe(listCount+1);
    }),
    test("should mark todo as complete",()=>{
        expect(all[0].completed).toBe(false);
        markAsComplete(0);
        expect(all[0].completed).toBe(true);
    })
})