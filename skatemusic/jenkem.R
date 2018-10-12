library(tidyverse)

# join on genre, track genre over time (y = count, bubble with artist name, x=year), or stacked bar chart over time

# Barplot showing most popular artists

# waffle-chart: genre by brand (interactive - select brand), also most popular artist

# Most similar tastes in music

# Most monotonic/diverse tastes in music


# 1. Interactive bubble chart: http://vallandingham.me/bubble_charts_with_d3v4.html
# 2. By company (genre by band? Artist by band)
# 3. By particular skater

# Artists to remove: SRKP, 

# link to genres
# get each by year (count number of times appeared in 2017)

data <- read_csv("/Users/jared/Desktop/jenkem/data/jenkem_data1.csv")

## SELECT ONLY RELEVANT COLUMNS
df <- data %>%
  select(-c(X1, company, views, year, length)) %>%
  mutate(part=replace(part, part=='intro', 'Intro')) %>%
  mutate(part=replace(part, part=="Credits #2" | part=="credits", "Credits")) 



df2 <- data %>%
  select(-c(X1)) 
## Get counts for df_col
count_df <- function(column) {
  count_df <- df %>%
    group_by(column) %>%
    summarise(tote = n()) %>%
    arrange(desc(tote))  
  
  return(_df)
}

count_df <- df2
## Find most popular artists
count_df <- df2 %>%
  group_by(artist) %>%
  summarise(tote = n()) %>%
  arrange(desc(tote))  %>%
  mutate(group = ifelse(tote > 25, 'high', ifelse(tote > 8, 'medium', 'low'))) %>%
  filter(tote > 3) %>%
  mutate(genre_fake = ifelse(tote > 25, 'rap', ifelse(tote > 8, 'rock', 'country'))) %>%
  mutate(year = ifelse(tote > 25, 2008, ifelse(tote > 8, 2009, 2010))) 

count_df$id = 1:nrow((count_df))
ggenre = find_genre(count_df$artist[1:10])



# count number of times each brand uses each artist

count_df2 <- df2 %>%
  group_by(artist, company) %>%
  summarise(t = n())
count_df2


  summarise(tote = n()) %>%
  arrange(desc(tote))  %>%
  mutate(group = ifelse(tote > 25, 'high', ifelse(tote > 8, 'medium', 'low'))) %>%
  filter(tote > 3) %>%
  mutate(genre_fake = ifelse(tote > 25, 'rap', ifelse(tote > 8, 'rock', 'country'))) %>%
  mutate(year = ifelse(tote > 25, 2008, ifelse(tote > 8, 2009, 2010))) 











write_csv(count_df, '~/Desktop/jenkem/data/soundtrack_data.csv')

## Find most popular artists group/ungroup
tt <- df2 %>%
  group_by(artist) %>%
  summarise(tote = n()) %>%
  ungroup() %>%
  group_by(artist, year)  %>%
  summarise(ttote = n()) %>%
  arrange(desc(ttote))


keep <- c("Thrasher Magazine", "Zoo York", "DC Shoes", "Transworld Skateboarding", "Pyramid Country",
          "Real Skateboards", "éS Footwear", "Fourstar Clothing","Polar Skate Co", "Habitat Skateboards",
          "Alien Workshop")

art_keep <- count_df$artist[0:100]


company_df <- df2 %>%
  group_by(artist, company) %>%
  summarise(company_total = n()) %>%
  arrange(desc(company_total)) %>%
  filter(company %in% keep) %>%
  filter(artist %in% art_keep)

#, "Emerica", "Toy Machine", "Anti Hero Skateboards", "SK8MAFIA", "Osiris Shoes")

c2 <- spread(company_df, key=company, value=company_total)
c2[is.na(c2)] <- 0

# rows: artist
# columns: company
# elements: count
write_csv(c2, '~/Desktop/jenkem/data/company_data.csv')
# get counts for skaters
count_skaters <- df %>%
  group_by(part) %>%
  summarise(tote = n()) %>%
  arrange(desc(tote))

# get counts for brands
count_brands <- df2 %>%
  group_by(company) %>%
  summarise(tote = n()) %>%
  arrange(desc(tote))

# Find top artist per brand
brands_top_artist <- function(brand, num_return=25) {
  count_brands <- df2 %>%
    filter(company==brand) %>%
    group_by(artist) %>%
    summarise(tote = n()) %>%
    arrange(desc(tote))
  return(count_brands)
}


brands_top_artist('Thrasher Magazine')
brands_top_artist('DC Shoes')
brands_top_artist('Element Skateboards')
brands_top_artist('Transworld Skateboarding')
brands_top_artist('Shake Junt')
brands_top_artist('Baker Skateboards')
brands_top_artist('Chocolate Skateboards')
brands_top_artist('Habitat Skateboards')
brands_top_artist('SK8MAFIA')
brands_top_artist('Alien Workshop')

cs <- data.frame(count_skaters)

ggplot(data = count_df) +
  geom_histogram(mapping=aes(x=tote))

find_artist <- function(art) {data.frame(filter(df, artist == art))}
find_skater <- function(skater) {data.frame(filter(df, part == skater))}

find_artist("Black Sabbath")
find_artist("Dinosaur Jr.")
find_artist("Jimi Hendrix")
find_artist('Lynyrd Skynyrd')

find_skater('Cody McEntire')

count_skaters
count_skaters %>%
  mutate(part=replace(part, part=='intro', 'Intro')) %>%
  mutate(part=replace(part, part=="Credits #2" | part=="credits", "Credits"))




# spotify
client_id = "bdfd894037384c10b350c349c3fce54a"
client_secret = "bd8a4e50e305475da9e3e6c136c97493"
app_id = "jared"
library(Rspotify)
x#keys <- spotifyOAuth(app_id, client_id, client_secret)
searchArtist("Jimi Hendrix",token=keys)$genre[1]


find_genre <- function(artist) {
  artist = as.character(artist)
  print(artist)
  genres = searchArtist(artist, token=keys)
  if (is.null(genres)) {return("Other")}
  if (is.null(genres$genre[1])) {return("Other")}
  print(genres$genre[1])
  arr = strsplit(genres$genre[1], ',')[[1]]
  return(
    ifelse('classic rock' %in% arr, 'Classic Rock', ifelse(
      'punk' %in% arr, 'Punk', ifelse(
      'indie rock' %in% arr, 'Indie', ifelse(
        'metal' %in% arr, 'Metal', ifelse(
          'hip hop' %in% arr, 'Hip Hop', ifelse(
            'edm' %in% arr, 'Electronic', ifelse(
              'indietronica' %in% arr, 'Electronic', 'Other'
            ))))))))}



ggenres = c()
for (i in 1:length(count_df$artist)) {
  ggenres[i] <- find_genre(count_df$artist[i])
}
count_df$genre <- ggenres
