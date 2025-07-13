# Notes on book "Clean Code: A Handbook of Agile Software Craftsmanship" by Robert C. Martin

### Chapter 2 - Meaningful Names

- Use Intention-Revealing Names: Choose names that clearly indicate why a variable, function, or class exists, what it does, and how it is used.
- Avoid Disinformation: Names should not be misleading. Make sure they accurately describe the entity's purpose and function.
- Use Pronounceable Names: Names should be easy to say and understand. This improves communication among team members and makes names easier to remember and search for in the codebase.
- Avoid Mental Mapping: The need to translate or interpret names in your head adds cognitive load. Use straightforward and descriptive names to minimize confusion.
- Class Names Should Be Nouns or Noun Phrases: This makes the purpose of the class clear, indicating that it represents an object or a concept.
- Method Names Should Be Verbs or Verb Phrases: This clarifies that the method performs an action.
- Consistent Terminology: Use one word per concept throughout the codebase. For example, choose between fetch, get, receive, or retrieve consistently, or define specific meanings for each and communicate these definitions clearly to your team.
- Avoid Overloading Names: Do not use the same word for different purposes. For instance, if add is used for combining data sets, use insert or append for adding individual elements to a list to avoid confusion.
- Use Solution Domain Names: Where possible, use names that reference established concepts from computer science or the specific solution domain, such as algorithm names or design patterns. This helps other programmers quickly understand the purpose of the code without needing extra explanation.
- Context Should Be Clear and Meaningful: Provide sufficient context in names to avoid ambiguity. For example, use addressState instead of just state to clearly indicate that the variable pertains to a geographic location, rather than the state of an object or process.

### Chapter 3 - Functions

- First rule of function is that it should be small. The second rule is it should be smaller than that. 
- Follow S of SOLID principle - Single Responsibility Principle (SRP): Function should perform only one thing. We should note that the function with one function cannot be divided into mulitple functions.
- If it has blocks, create separate function for the block and call it. Do not go to third identation.
- Try to replace switch statements with polymorphism.
    ```csharp
    int calculatePaymentforEmployee(Employee e){
        switch(e.type){
            case "Hourly":
                return calculateHourlyRate(e);
            case "Salaried":
                return calculateSalariedRate(e);
        }
    }
    # Rep;ace by
    class Employee { virtual int CalculatePay(){ /**/ } }
    class HourlyEmployee: Employee { override int CalculatePay(){ /**/ } }
    class SalariedEmployee: Employee { override int CalculatePay(){ /**/ } }
    int calculatePaymentforEmployee(Employee e) => e.CalculatePay();
    ```
- Use same phrases, nouns and verbs in the function names you choose for modules to tell a story in better manner.
- Function Arguments
    - Try to use zero, one or two. three should be rear and more should be 
    avoided. Replace poly arguments with an object.
    - Flag arguments should be avoided. We can use separate function instead.
    - Monad (single argument) function name should follow verb noun. For example, write (name). Function name can be descriptibe and ust be like writeField(name), assertExpectedEquals(expected, actual), which is much more descriptive
- Function should not have side affects or hidden things. If function is intended to one thing and does another thing, it is not a ideal function.
- Command Query Separation - should do something or answer something not both. For example, `if(set(username, value)){}` does two things. First, it set username. Secondly it returns boolean value which we are using for our conditional statement. It does two things. It should be avoided.
- Prefer Exception to Returning Codes sepcially when those error code can be passed to multiple layers. But, in some programming language like C#, exception are expensive.
- Follow DRY - Don't Repeat Yourself - If you have some logic in 4 functions, and by any chance you have to change the logic there are 4 places to change and thus 4 places to test. So, follow DRY.
- Some considers only one Return - no break, continue, multiple returns, and so on.


### Chapter 4 - Comments

- Avoid comments: your function name, variable names should be self descriptive. If you cannot name functions, break it. Comments are code smell which will be ignored by other developers. Additionally, if someone changes the code, no one will update the comment. As a result, comment and code will not match. "Explain yourself in code".
- Comment shows that it is our failure to express ourself in code.
- Good comments:
    - If we have to comment, few comments and strucutred comments are far better.
    - Legal comments like copyright might be necessary.
    - Intent should be explained
    - Warning of Consequences
    - TODO comments
    - Amlification of the importance can be commented.
    - docs of apis such as javadocs, swagger api might be important.
- Bad commnets:
    - Closing braces comment.
    - commented out code - git helps us to track the code - commented code will always remain as code smell because nobody will care to remove that code
    - Nonlocal comments: make sure that comment appear near to its intent
    - Docs in non-public code such as javadocs or jsdocs


### Chapter 5 - Formatting

- Limited horizontal line and vertical line - smaller file are ready to study
- vertical space might denote the change in context or grouping
- variable declarations should be as close as to the use
- if one functions call another function, they should be close - natural flow is function just below the calling function
- Vertical Ordering - most important part at the beginning
- Identation is important for horizontal spacing
- Formatting should follow the team rules - what team decides - because everyone loves their own formatting.


### Chapter 6 - Objects and Data Structures

- Hiding implementations cleans the code. It is the abstractions also. For instance having variable x, y or getX, getY, setx, setY. The latter one is always better.
- `Objects hides the data behind abstraction which is the functions. On the other hand, data structure exposes their data and have no meaningful functions.`
- Procedural Code - code using data structures - makes it easy to add new functions without changing the existing data structures. OO code, on the other hand, makes it easy to add new classes without changing existing functions.
- Complimentarily: Procedural code makes it hard to add new data structures because all the functions must change. OO code makes it hard to add new functions because all the classes must change.
- Example of Data Structure
    ```csharp
    public class Square {
        public Point topLeft;
        public double side;
    }
    public class Rectangle {
        public Point topLeft;
        public double length;
        public double breadth;
    }

    public class Geometry{
        public double area(Object shape){
            switch(shape){
                case Shape.Sqaure:
                    return shape.side*shape.side;
                case Shape.Rectangle:
                    return shape.length*shape.breadth;
            }
        }
    }
    ```
- Example of Polymorphism
    ```csharp
    public class Shape {}
    public class Square: Shape {
        public Point topLeft;
        public double side;
        
        public double area(){
            return side*side;
        }
    }
    public class Rectangle: Shape {
        public Point topLeft;
        public double length;
        public double breadth;

        public double area(){
            return length*breadth;
        }
    }
    ```
- Objects expose behavior and hide data. Makes easy to add new kinds of objects without changing existing behaviors. But hard to add functions. Data strucutres is opposite. It hides behavior and expose data. Makes easy to add new function but hard to add new data structure because every function would require change.
- `Law of Demeter`
    - method _f_ of a class _C_ should only call the methods of these:
        - _C_
        - An object created by _f_
        - An object passed as an argument to _f_
        - An object held in an instance variable of _C_
    - method should not invoke method of objects that are returned by the allowed functions
    - talk to friends not strangers (talking about functions OO, not dsa where demeter does not apply)
        - shape.size.length.centimeter - does not viloate demeter because dsa has no concept of it
        - shape.size().length().... then violotes the demeter because of function
- DTOs are better


### Chapter 7 - Error Handling

- Use exceptions rather than return codes. But make sure in some programming languages like C#, it has performance issue.
- try-catch-finally
- Provide Context with Exceptions: enough information like source and location, create informative error messages
- Definex exception classes if callers need them. Wrap third party libraries with your own including exception
- Do not return null, otherwise client code will need to check null frequently. Do not pass the null.
- Define normal flow. Example of `Special Case Pattern`. The client code does not need to know or handle the exception.
```csharp
try{
    MealExpenses expenses = reportDAO.GetMeals(employee.GetId())
    mTotal += expenses.getTotal();
}
catch(NotFoundException e){
    mTotal += GetMealPerDiem();
}
// Replaced By
MealExpenses expenses = reportDAO.GetMeals(employee.GetId())
mTotal += expenses.getTotal();
// we create special object to handle special case like handling above exception case
public class PerDiemMealExpenses: MealExpenses{
    public int getTotal(){
        // return the per diem default
    }
}
// now, reportDao get meails will return meal expenses MealExpenses either with real data or the PerDiemMealExpenses if employee not found.
```

### Chapter 8 - Boundries

- Try to wrap the third party libraries
- Learning tests can be used to test third-party library APIs. It not only helps testing, also check the understanding of the API.
- If code does not exist, use fake apis. Use it using `Adapter Pattern`. Call the interface. We can easily replace the fake one by the real one which calls the real api. It would be wrapper to the actual api.


### Chapter 9 - Unit Tests

- Three laws of TDD: 
    - First law: you may not write production code until you have written a failing unit test.
    - Second law: you may not write more of a unit test than is sufficient to fail, and not compiling is failing
    - Third law: you may not write more production code than is sufficient to pass the currently failing test
- Keep Tests clean - it should be as good as production code
- One assert per test - single concept per test - single test
- minimize the number of asserts per concept and test just one concept per test function
- Clean Tests follow five other rules FIRST:
    - Fast
    - Independent
    - Repeatable: repeatable  in any environment
    - Self-Validating: should have boolean output
    - Timely - write in time, unit tests should be written before production code

### Chapter 10 - Classes

- Class Organization - public static constants, private static variables, private instance variables (will there be public variable - remember encapsulation and abstraction)
- classes should be small - another rule is it should be smaller than that
- classes use different measure - responsibilites
    - SRP - Single Responsibility Principle: should have single reason to change
    - Cohesion: we have to make class with high cohesive
        - rules
            - should have small number of instance variables
            - each of the methods of a class should manipulate one or more of those variables
            - more variables method manipulates the more cohesive the method is to its class
            - a class in which each variable is used by each method is maximally cohesive
        - maintaining high cohesion will result in many small classes
- changes: we extend the system, not modify the system (Open-Close Principle)
- classes should depend upon abstractions/interfaces, not in concrete details (DIP - Dependency Injection Principle)

### Chapter 11 - Systems

- Construction of system and use is different thing and we should not mix them. System here can be anything from the entire system to the object. For instance, application should not have knowledge of main or the construction process.
    - main -> builder -> construct object | main -> run application -> access constructed object
    - dependency injection is a good example of this
- impossible to make perfect system and right at the first time - separatio of concern can easily scale up when time comes

### Chapter 12 - Emergence

- Design is simple if following rules holds true in order of importance
    - Runs all the tests
    - Contains no duplication
    - Expresses the intent of the programmer
    - Minimizes the number of classes and methods
- Final three is Refactoring; first rule ensure that refactoring is good for program
- Use domain names - like using name of Command or Visitor to express the pattern will help developers
- if we follow SRP; it can lead to too many classes and methods. Forth rule ensures that class and function count is low

### Chapter 13 - Concurrency

- Myths which are not true
    - Concurrency always improve performance
    - Design does not change while writing concurrent programs
    - understanding concurrency issue is not important while working with a container such as a Web
- But,
    - incurs some overhead in both performance and code
    - complex even for simple problems
- SRP
    - concurrency code has its own lifestyle of dev, change, and tuning
    - it comes with its own challenges
    - So, keep concurrency-related code completely different
    - limit the scope of data: take data encapsulation severely
    - use copies of data rather than shared data
    - threads should be as indepdendent as possible: divide data that can be processed independently, and then code and thread
    - avoid using more than one method on a shared object
- know execution models: bound resources, mutual exclusion, starvation, deadlock, livelock
- <mark> Need to study more on this topic along base. </mark>


### Chapter 14 - Successive Refinement

### Chapter 15 - Refactoring

- TDD approach 
    - Red, Green, Refactoring
    - First make it work by making it green
    - Support it by test
    - Then refactor as much as you can

### Chapter 16 - Smells and Heuristics

- Comments
    - Inappropriate Information
    - Obsolete Comment
    - Redundant Comment
    - commented out code
    - poorly written comment
- Environment
    - Build requires more than one step
    - test requires more than one step
- Functions
    - Too many arguments
    - output arguments
    - flag arguments
    - dead function: never called function
- General
    - multiple languages in one source file
    - obvious behavior is unimpletemented
    - incorrect behavior at the boundries - boundry condition in test case for instance
    - overriden safeties
    - duplication
    - code at wrong level of abstraction: constants, variables pertained to detailed implementation should not be present in the base class -> so, lower level concepts to be in the derivatives and all the higher level concepts to be in the base class
    - base class depending upon their derivatives
    - too much information - too many exposed interfaces is bad
    - dead code: if condition that will never happen for example
    - vertical separation: variables and function should be defined close to where they are used; local variables close to usage
    - inconsistency
    - clutter - unused variables, functions, comments, and all
    - artificial coupling - enum should not be inside classes, otherwise they will have coupling and to access enum we need to know class
    - Feature envy - methods of a class should be interested in the variables and methods of the same class, not classes or objects it is calling. If A calls B object and B calls C, we cannot access C. if we need data from C, we wish that B gives us those information through methods
    - selector arguments to the function which is boolean
    - use of magic numbers, string
    - Misplaces responsiblity - we should follow prinicple of least surprise: code should be places where a reader would naturally expect it to be
    - inappropriate static 
    - use explanatory variables
    - function names should say what they do
    - understand the algorithm
    - make logical dependencies physical: place page size in HourReportFormatter rather than HourReport for instance
    - prefer polymorphism to if/else or switch/case
    - follow standard conventions
    - be precise
    - encapsulate conditionals
        - `if(shouldBeDeleted(timer))` over `if(timer.hasExpried() && !timer.isRecurrent())`
    - avoid negative conditionals
    - functions should do one thing
    - hidden temporal couplings
        ```csharp
        Some some;
        public void DoSomething(){
            firstMethod();
            secondRunAfterFirstOnlyMethod();
            thirdRunAfterSecondOnlyMethod();
        }
        // Replace by
        Some some;
        public void DoSomething(){
            var retVal = firstMethod();
            var retVal2 = secondRunAfterFirstOnlyMethod(retVal);
            thirdRunAfterSecondOnlyMethod(retVal, retVal2); // something like this
        }
        ```
    - don't be arbitrary
    - encapsulate boundry counditions
    - function should descend only one level of abstraction - if/else or any other
    - writing shy code - violating the Law of Demeter
    - 





