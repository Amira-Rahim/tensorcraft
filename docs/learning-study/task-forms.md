# Participant task forms

The facilitator supplies one form at a time. Use JavaScript or plain language.
Spend up to 20 active minutes. Say when you are unsure. Record help used and
minutes spent; assistance is useful context, not something to hide.

## Form A: before the course

1. A JavaScript program changes its weights after comparing predictions with
   labeled past builds. Another loads frozen weights and scores one new
   build. Which is training, which is inference, and what changes in each?
2. You must flag a build when it starts. The dataset contains changed-file
   count and final execution duration. Which input is available then? Where
   would you fit a scaler when evaluating on later builds, and why?
3. On the same validation builds, policy A has 6 false positives and 2 false
   negatives; B has 2 false positives and 5 false negatives. A false positive
   costs 2 minutes and a false negative costs 8. Compute both costs and choose
   a policy for this decision. Is accuracy alone enough to choose?
4. The classifier outputs 0.93 for one build. What does this tell you, and
   what would you check before calling it a reliable 93% failure probability?
5. False positives now cost 8 minutes; missed failures still cost 8. Write
   a small JavaScript cost function, recompute both policies and choose again.
   Which data should drive this change, and what if you already used your
   final test results to choose it?

## Form B: immediately after the course

1. One program loads saved room-classifier weights and predicts occupancy.
   Another computes errors against labeled readings and updates the weights.
   Name the two operations and explain which changes the fitted model.
2. A room detector must decide at noon from current sensors. Candidate inputs
   include noon light and whether the room was occupied at 12:10. Explain
   your input choice and how to handle scaling when testing on a later week.
3. On identical validation readings, A has 8 false positives and 1 false
   negative; B has 2 false positives and 4 false negatives. Costs are 1 for
   a false positive and 5 for a missed occupant. Compute both costs, choose
   a policy and explain why accuracy alone may hide the tradeoff.
4. The room model outputs 0.88. Explain why this is not a guarantee about
   this reading and describe evidence needed to interpret it as a probability.
5. Unnecessary heating raises false-positive cost to 4; false-negative cost
   stays 5. Implement the cost calculation, choose again and explain how to
   evaluate the revised choice without reusing a test set for selection.

## Form C: seven-day check

1. A stock-alert program loads weights and scores a new item. A separate job
   adjusts weights using labeled past items. Name the operations and describe
   what each does to the fitted parameters.
2. At order time, an alert predicts late delivery. You have current backlog
   and actual arrival time recorded days later. Choose a usable input and
   explain where scaling is fitted when evaluating on subsequent orders.
3. On the same validation orders, A has 4 false positives and 2 false
   negatives; B has 1 false positive and 5 false negatives. Costs are 3 for
   a false positive and 4 for a miss. Compute both costs and justify a policy
   without relying only on accuracy.
4. The model outputs 0.81 for one item. Explain what this score does not
   establish and how you would check whether scores like it match outcome rates.
5. False-positive cost rises to 6; misses still cost 4. Implement the cost
   function and choose again. Explain how validation and fresh final evidence
   apply if you already examined test results while making this change.
